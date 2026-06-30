import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { VNPay, VnpLocale } from 'vnpay'
import { Fine } from './entities/fine.entity'
import { LibraryCard } from '@/modules/library-cards/entities/library-card.entity'
import { RealtimeGateway } from '@/common/websocket/realtime.gateway'

@Injectable()
export class VnpayService {
    private readonly logger = new Logger(VnpayService.name)
    private readonly vnpay: VNPay
    private readonly returnUrl: string

    constructor(
        @InjectRepository(Fine)
        private fineRepo: Repository<Fine>,
        @InjectRepository(LibraryCard)
        private cardRepo: Repository<LibraryCard>,
        private realtime: RealtimeGateway,
    ) {
        const tmnCode = process.env.VNPAY_TMN_CODE ?? ''
        const secureSecret = process.env.VNPAY_HASH_SECRET ?? ''
        const rawAlgorithm = process.env.VNPAY_HASH_ALGORITHM ?? 'SHA512'
        const validAlgorithms = ['SHA256', 'SHA512', 'MD5']
        const hashAlgorithm = validAlgorithms.includes(rawAlgorithm) ? rawAlgorithm : 'SHA512'
        // Note: HashAlgorithm is typed as numeric enum but library uses strings at runtime
        const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3001'
        this.returnUrl = `${backendUrl}/api/fines/vnpay-return`

        this.logger.log(`[CONFIG] VNPay: tmnCode="${tmnCode}", hashAlgorithm="${hashAlgorithm}", testMode=true, returnUrl="${this.returnUrl}"`)

        this.vnpay = new VNPay({
            tmnCode,
            secureSecret,
            hashAlgorithm: hashAlgorithm as any,
            vnp_Locale: VnpLocale.VN,
            testMode: true,
        })
    }

    /**
     * Tạo URL thanh toán VNPay cho một khoản phí phạt
     */
    createPaymentUrl(fineId: string, amount: number, ipAddr: string): string {
        const txnRef = `FINE-${fineId}-${Date.now()}`
        const tmnCode = process.env.VNPAY_TMN_CODE ?? ''
        const secureSecretFirst4 = (process.env.VNPAY_HASH_SECRET ?? '').substring(0, 4)
        const secureSecretLen = (process.env.VNPAY_HASH_SECRET ?? '').length

        this.logger.log(`[DEBUG] Env: VNPAY_TMN_CODE="${tmnCode}", VNPAY_HASH_SECRET len=${secureSecretLen} (first4="${secureSecretFirst4}...")`)
        this.logger.log(`[DEBUG] returnUrl="${this.returnUrl}"`)

        const buildData = {
            vnp_Amount: amount,
            vnp_TxnRef: txnRef,
            vnp_OrderInfo: `Thanh_toan_phi_phat_thu_vien`,
            vnp_ReturnUrl: this.returnUrl,
            vnp_IpAddr: ipAddr,
        }
        this.logger.log(`[DEBUG] buildPaymentUrl input: ${JSON.stringify(buildData)}`)

        const paymentUrl = this.vnpay.buildPaymentUrl(buildData)

        this.logger.log(`VNPay payment URL created: txnRef=${txnRef}, amount=${amount}`)
        this.logger.log(`[DEBUG] Full payment URL: ${paymentUrl}`)

        // Parse and log individual query params from the generated URL
        try {
            const urlObj = new URL(paymentUrl)
            const params: Record<string, string> = {}
            urlObj.searchParams.forEach((v, k) => {
                if (k !== 'vnp_SecureHash') params[k] = v
            })
            const hash = urlObj.searchParams.get('vnp_SecureHash')
            this.logger.log(`[DEBUG] URL params (excl hash): ${JSON.stringify(params)}`)
            this.logger.log(`[DEBUG] vnp_SecureHash="${hash}"`)
        } catch { }

        return paymentUrl
    }

    /**
     * Xử lý return URL từ VNPay (user được redirect về sau khi thanh toán)
     * Kết hợp xác thực + cập nhật trạng thái fine luôn
     */
    async handleReturn(query: Record<string, any>): Promise<{ isSuccess: boolean; fineId: string; message: string }> {
        this.logger.log(`[DEBUG] VNPay return query: ${JSON.stringify(query)}`)

        // Also log raw query for signature debugging
        const { vnp_SecureHash: receivedHash, ...paramsForHash } = query
        this.logger.log(`[DEBUG] Params for hash verification: ${JSON.stringify(paramsForHash)}`)
        this.logger.log(`[DEBUG] Received vnp_SecureHash="${receivedHash}"`)

        // Validate that we have a hash to verify
        if (!receivedHash) {
            this.logger.warn('VNPay return called without vnp_SecureHash — missing query params')
            return { isSuccess: false, fineId: '', message: 'Thiếu thông tin xác thực từ VNPay' }
        }

        let verify: any
        try {
            verify = this.vnpay.verifyReturnUrl(query as any)
        } catch (err) {
            this.logger.error(`VNPay verifyReturnUrl threw an exception: ${err}`)
            return { isSuccess: false, fineId: '', message: 'Lỗi xác thực chữ ký VNPay' }
        }

        this.logger.log(`VNPay return verify: isVerified=${verify?.isVerified}, isSuccess=${verify?.isSuccess}, vnp_ResponseCode=${verify?.vnp_ResponseCode}`)
        this.logger.log(`[DEBUG] verify object: ${JSON.stringify(verify)}`)

        // Fallback: Manual signature verification if the library fails (due to encoding differences like + vs %20)
        if (!verify?.isVerified) {
            this.logger.warn(`[DEBUG] Library verification failed, attempting manual fallback verification...`)
            const secureSecret = process.env.VNPAY_HASH_SECRET ?? ''
            const rawAlgorithm = process.env.VNPAY_HASH_ALGORITHM ?? 'SHA512'
            const hashAlgorithm = ['SHA256', 'SHA512', 'MD5'].includes(rawAlgorithm) ? rawAlgorithm : 'SHA512'

            const sortedKeys = Object.keys(paramsForHash).sort()
            const signParams: string[] = []
            for (const key of sortedKeys) {
                if (paramsForHash[key] !== '' && paramsForHash[key] !== undefined && paramsForHash[key] !== null) {
                    // Try RFC 3986 encoding (some VNPay systems expect %20 for space, others expect +)
                    // We'll use encodeURIComponent which generates %20. If it fails, we can also try +.
                    signParams.push(`${key}=${encodeURIComponent(String(paramsForHash[key]))}`)
                }
            }
            const signString = signParams.join('&')
            const crypto = require('crypto')
            const hmac = crypto.createHmac(hashAlgorithm === 'SHA256' ? 'sha256' : 'sha512', secureSecret)
            const signed = hmac.update(Buffer.from(signString, 'utf-8')).digest('hex')
            
            if (signed === receivedHash) {
                this.logger.log(`[DEBUG] Manual verification SUCCESS (RFC 3986)!`)
                verify = { isVerified: true, isSuccess: String(query.vnp_ResponseCode) === '00', vnp_ResponseCode: query.vnp_ResponseCode, vnp_TxnRef: query.vnp_TxnRef }
            } else {
                // Try with + instead of %20
                const signParamsPlus: string[] = []
                for (const key of sortedKeys) {
                    if (paramsForHash[key] !== '' && paramsForHash[key] !== undefined && paramsForHash[key] !== null) {
                        signParamsPlus.push(`${key}=${encodeURIComponent(String(paramsForHash[key])).replace(/%20/g, '+')}`)
                    }
                }
                const signStringPlus = signParamsPlus.join('&')
                const hmacPlus = crypto.createHmac(hashAlgorithm === 'SHA256' ? 'sha256' : 'sha512', secureSecret)
                const signedPlus = hmacPlus.update(Buffer.from(signStringPlus, 'utf-8')).digest('hex')
                
                if (signedPlus === receivedHash) {
                    this.logger.log(`[DEBUG] Manual verification SUCCESS (using + for spaces)!`)
                    verify = { isVerified: true, isSuccess: String(query.vnp_ResponseCode) === '00', vnp_ResponseCode: query.vnp_ResponseCode, vnp_TxnRef: query.vnp_TxnRef }
                } else {
                    this.logger.error(`[DEBUG] Manual verification failed. Expected: ${receivedHash}. Got: ${signed} (RFC3986) or ${signedPlus} (Plus)`)
                }
            }
        }

        if (!verify?.isVerified) {
            return { isSuccess: false, fineId: '', message: 'Chữ ký không hợp lệ' }
        }

        if (!verify.isSuccess || String(verify.vnp_ResponseCode) !== '00') {
            // Parse fineId từ vnp_TxnRef để frontend có thể hiển thị nút "Thử lại"
            const txnRef = String(verify.vnp_TxnRef || '')
            const failFineId = this.parseFineIdFromTxnRef(txnRef) || ''
            return { isSuccess: false, fineId: failFineId, message: `Thanh toán thất bại. Mã lỗi: ${verify.vnp_ResponseCode}` }
        }

        // Parse fineId từ vnp_TxnRef: FINE-{fineId}-{timestamp}
        const txnRef = String(verify.vnp_TxnRef)
        const fineId = this.parseFineIdFromTxnRef(txnRef)
        if (!fineId) {
            return { isSuccess: false, fineId: '', message: 'Mã giao dịch không hợp lệ' }
        }

        // Cập nhật trạng thái fine trực tiếp (không qua FinesService.payFine để tránh
        // lỗi foreign key vì collectedBy không có user thật)
        try {
            const fine = await this.fineRepo.findOneBy({ id: fineId })
            if (!fine) throw new NotFoundException('Không tìm thấy khoản phí')
            if (fine.status !== 'pending') throw new BadRequestException('Khoản phí này đã được xử lý')

            fine.status = 'paid'
            fine.paidAt = new Date()
            fine.paymentMethod = 'vnpay'
            fine.receiptNumber = `VNPAY-${txnRef.substring(0, 30)}`
            await this.fineRepo.save(fine)

            // Mở khóa thẻ nếu hết phí phạt
            await this.unlockCardIfNoPendingFines(fine)

            // Emit realtime events
            this.realtime.emit('librarian:dashboard-update')
            this.realtime.emit('admin:dashboard-update')
            this.realtime.emit('reader:dashboard-update')

            this.logger.log(`VNPay return: Fine ${fineId} paid successfully via VNPay (txnRef=${txnRef})`)
            return { isSuccess: true, fineId, message: 'Thanh toán thành công' }
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                return { isSuccess: false, fineId: '', message: error.message }
            }
            this.logger.error(`VNPay return update error: ${error}`)
            return { isSuccess: false, fineId: '', message: 'Lỗi cập nhật trạng thái thanh toán' }
        }
    }

    /**
     * Mở khóa thẻ thư viện nếu người dùng không còn phí phạt pending nào.
     */
    private async unlockCardIfNoPendingFines(paidFine: Fine) {
        try {
            const fineWithRelations = await this.fineRepo.findOne({
                where: { id: paidFine.id },
                relations: { borrowRecord: { libraryCard: true } }
            })
            const userId = fineWithRelations?.borrowRecord?.libraryCard?.userId
            if (!userId) return

            const remaining = await this.fineRepo.count({
                relations: { borrowRecord: { libraryCard: true } },
                where: {
                    borrowRecord: { libraryCard: { userId } },
                    status: 'pending'
                }
            })
            if (remaining === 0) {
                const card = await this.cardRepo.findOne({ where: { userId } })
                if (card && card.status === 'locked') {
                    card.status = 'active'
                    await this.cardRepo.save(card)
                }
            }
        } catch (err) {
            this.logger.error('Lỗi khi mở khóa thẻ sau VNPay:', err)
        }
    }

    private parseFineIdFromTxnRef(txnRef: string): string | null {
        const match = txnRef.match(/^FINE-([a-f0-9-]+)-/)
        return match ? match[1] : null
    }
}
