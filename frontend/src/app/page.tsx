import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Library, Search, ArrowRight, Star, BookMarked, ShieldCheck } from 'lucide-react'

// Danh sách một số đầu sách nổi bật để quảng cáo trên trang chủ
const FEATURED_BOOKS = [
  { id: 'book1', title: 'Đắc Nhân Tâm', author: 'Dale Carnegie', coverUrl: '/covers/dac-nhan-tam.png' },
  { id: 'book11', title: 'Harry Potter và Hòn Đá Phù Thủy', author: 'J.K. Rowling', coverUrl: '/covers/harry-potter.png' },
  { id: 'book6', title: 'Atomic Habits', author: 'James Clear', coverUrl: '/covers/atomic-habits.png' },
  { id: 'book4', title: 'Sapiens: Lược Sử Loài Người', author: 'Yuval Noah Harari', coverUrl: '/covers/sapiens.png' },
  { id: 'book2', title: 'Nhà Giả Kim', author: 'Paulo Coelho', coverUrl: '/covers/nha-gia-kim.png' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-[#FFF8F0]/90 backdrop-blur-md border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Library className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-[#3D2B1F]">Bookly</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/auth/login" 
                className="text-[#3D2B1F] hover:text-primary transition-colors font-medium"
              >
                Đăng nhập
              </Link>
              <Link 
                href="/auth/register" 
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-glow"
              >
                Đăng ký
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section (Full Width Banner) */}
        <section className="relative w-full min-h-[600px] lg:h-[calc(100vh-64px)] bg-gradient-to-br from-[#2C1810] via-[#4A2F1A] to-[#6B4226] flex items-center overflow-hidden">
          {/* SVG Grid pattern similar to user's uploaded background (Crosses + Brown bg) */}
          <div className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          {/* Decorative glows */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full opacity-20 bg-[radial-gradient(circle,#E8941A_0%,transparent_70%)] blur-2xl" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full opacity-15 bg-[radial-gradient(circle,#F5B642_0%,transparent_70%)] blur-2xl" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center justify-between w-full py-12 sm:py-16 lg:py-0 mt-8 lg:mt-0">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left mb-16 lg:mb-0 lg:pr-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-amber-200 font-medium text-xs sm:text-sm mb-6 border border-white/20 backdrop-blur-sm shadow-lg">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-300 text-amber-300" />
                <span>Thư viện số hàng đầu</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4 sm:mb-6 leading-tight drop-shadow-md">
                Khám Phá <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5B642] to-[#E8941A]">Tri Thức Vô Tận</span>
              </h1>
              
              <p className="text-sm sm:text-base lg:text-lg text-amber-100/90 mb-8 sm:mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0 drop-shadow">
                Hàng ngàn đầu sách phong phú, từ văn học kinh điển đến khoa học hiện đại. 
                Đăng ký mượn trực tuyến, nhận sách nhanh chóng và quản lý tiện lợi mọi lúc mọi nơi.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <Link 
                  href="/reader/books" 
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-[#E8941A] to-[#C97A10] hover:from-[#F5B642] hover:to-[#E8941A] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-semibold transition-all shadow-glow hover:scale-105 w-full sm:w-auto border border-[#F5B642]/30"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Mượn Sách Ngay</span>
                </Link>
                <Link 
                  href="/auth/register" 
                  className="flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-semibold transition-all shadow-soft hover:shadow-card w-full sm:w-auto"
                >
                  <span>Tham Gia Thư Viện</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>

            {/* Right Books Collage */}
            <div className="flex-1 w-full max-w-xs sm:max-w-sm lg:max-w-md relative pb-10 lg:pb-0">
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:gap-6 rotate-[-4deg] scale-95 lg:scale-100 hover:scale-105 transition-transform duration-700 ease-out mx-auto">
                {/* Column 1 */}
                <div className="space-y-3 sm:space-y-5 lg:space-y-6 lg:-mt-16">
                  <div className="relative aspect-[2/3] w-full rounded-lg shadow-2xl overflow-hidden border border-white/20 transform transition hover:-translate-y-2 hover:rotate-3">
                    <Image src={FEATURED_BOOKS[0].coverUrl} alt={FEATURED_BOOKS[0].title} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                  </div>
                  <div className="relative aspect-[2/3] w-full rounded-lg shadow-2xl overflow-hidden border border-white/20 transform transition hover:-translate-y-2 hover:rotate-3">
                    <Image src={FEATURED_BOOKS[2].coverUrl} alt={FEATURED_BOOKS[2].title} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                  </div>
                </div>
                
                {/* Column 2 */}
                <div className="space-y-3 sm:space-y-5 lg:space-y-6 mt-6 sm:mt-10 lg:mt-8">
                  <div className="relative aspect-[2/3] w-full rounded-lg shadow-2xl overflow-hidden border border-white/20 transform transition hover:-translate-y-2 hover:-rotate-3">
                    <Image src={FEATURED_BOOKS[1].coverUrl} alt={FEATURED_BOOKS[1].title} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                  </div>
                  <div className="relative aspect-[2/3] w-full rounded-lg shadow-2xl overflow-hidden border border-white/20 transform transition hover:-translate-y-2 hover:-rotate-3">
                    <Image src={FEATURED_BOOKS[3].coverUrl} alt={FEATURED_BOOKS[3].title} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom SVG wave divider for smooth transition to white section */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] z-20">
            <svg className="relative block w-[calc(100%+1.3px)] h-[30px] sm:h-[50px] lg:h-[80px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" fill="#ffffff" />
            </svg>
          </div>
        </section>

        {/* Featured Books Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12 border-b border-gray-100 pb-6">
              <div>
                <h2 className="text-3xl font-bold text-[#3D2B1F]">Sách Nổi Bật</h2>
                <p className="mt-2 text-[#3D2B1F]/70">Những tác phẩm kinh điển được mượn nhiều nhất</p>
              </div>
              <Link href="/reader/books" className="hidden sm:flex items-center text-primary font-semibold hover:text-primary-dark transition-colors">
                Xem tất cả sách <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {FEATURED_BOOKS.map((book, idx) => (
                <Link href="/reader/books" key={idx} className="group flex flex-col items-center">
                  <div className="w-full aspect-[2/3] relative rounded-xl overflow-hidden shadow-soft border border-gray-100 group-hover:shadow-card group-hover:-translate-y-2 transition-all duration-300">
                    <Image src={book.coverUrl} alt={book.title} fill sizes="(max-width: 768px) 100vw, 20vw" className="object-cover" />
                  </div>
                  <h3 className="mt-5 font-bold text-[#3D2B1F] text-center group-hover:text-primary transition-colors line-clamp-2 leading-snug px-2">{book.title}</h3>
                  <p className="text-sm text-[#3D2B1F]/60 text-center mt-1">{book.author}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-gradient-to-b from-[#FFF8F0] to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-[#3D2B1F]">Vì Sao Chọn Bookly?</h2>
              <p className="mt-4 text-[#3D2B1F]/70">Trải nghiệm thư viện số với hệ thống quản lý hiện đại.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-soft hover:shadow-card transition-shadow transform hover:-translate-y-1 duration-300 border border-gray-50">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#3D2B1F] mb-3">Đầu Sách Đa Dạng</h3>
                <p className="text-[#3D2B1F]/70">
                  Thư viện liên tục cập nhật hàng trăm tựa sách mới mỗi tháng, đa dạng mọi thể loại đáp ứng nhu cầu của bạn.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-soft hover:shadow-card transition-shadow transform hover:-translate-y-1 duration-300 border border-gray-50">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
                  <BookMarked className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#3D2B1F] mb-3">Mượn Sách Dễ Dàng</h3>
                <p className="text-[#3D2B1F]/70">
                  Chỉ với vài thao tác click, bạn đã có thể đăng ký mượn sách trực tuyến và nhận sách một cách nhanh chóng.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-soft hover:shadow-card transition-shadow transform hover:-translate-y-1 duration-300 border border-gray-50">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#3D2B1F] mb-3">Quản Lý Tiện Lợi</h3>
                <p className="text-[#3D2B1F]/70">
                  Theo dõi lịch sử mượn trả, nhận thông báo gia hạn và quản lý tài khoản của bạn mọi lúc, mọi nơi.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Library className="h-6 w-6 text-primary" />
            <span className="font-bold text-[#3D2B1F]">Bookly</span>
          </div>
          <div className="text-[#3D2B1F]/50 text-sm font-medium">
            &copy; {new Date().getFullYear()} Hệ Thống Quản Lý Thư Viện. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}