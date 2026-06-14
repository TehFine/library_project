"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, ShieldCheck, Phone, Calendar, MapPin, CheckCircle, ArrowRight, ArrowLeft, LogIn, AlertTriangle, PartyPopper } from "lucide-react";
import { authApi } from "@/lib/api";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface FormData {
  fullName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
  dateOfBirth: string;
}

const INITIAL: FormData = {
  fullName: "",
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
  phone: "",
  address: "",
  dateOfBirth: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const today = new Date();
  const maxDate = new Date(today.setFullYear(today.getFullYear() - 18))
    .toISOString()
    .split("T")[0];

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function validateStep1(): string {
    if (!form.fullName.trim()) return "Vui lòng nhập họ tên";
    if (!form.email.trim()) return "Vui lòng nhập email";
    if (!form.username.trim()) return "Vui lòng nhập tên đăng nhập";
    if (form.password.length < 8) return "Mật khẩu ít nhất 8 ký tự";
    if (form.password !== form.confirmPassword)
      return "Mật khẩu xác nhận không khớp";
    return "";
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.dateOfBirth) {
      setError("Vui lòng nhập ngày sinh");
      return;
    }
    const birthDate = new Date(form.dateOfBirth);
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    if (birthDate > eighteenYearsAgo) {
      setError("Bạn phải từ đủ 18 tuổi trở lên mới được đăng ký.");
      return;
    }

    if (form.phone) {
      const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
      if (!phoneRegex.test(form.phone)) {
        setError(
          "Số điện thoại không hợp lệ (phải là số di động VN bắt đầu bằng 03, 05, 07, 08, 09 và đủ 10 số).",
        );
        return;
      }
    }
    setLoading(true);
    setError("");
    try {
      await authApi.register({
        email: form.email,
        password: form.password,
        username: form.username,
        fullName: form.fullName,
        phone: form.phone,
        address: form.address,
        dateOfBirth: form.dateOfBirth,
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">Đăng ký thành công! <PartyPopper className="w-6 h-6 text-amber-500" /></h1>
        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
          Tài khoản đã được tạo. Vui lòng đến thư viện với CCCD để nhận thẻ mượn sách.
        </p>
        <Button
          className="mt-8 shadow-lg shadow-primary/25"
          fullWidth
          size="lg"
          onClick={() => router.push("/auth/login")}
        >
          <LogIn className="w-5 h-5" />
          Đăng nhập ngay
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Tham gia thư viện Bookly để khám phá hàng ngàn đầu sách.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-6">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-3 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300 ${
                step >= s
                  ? "bg-gradient-to-br from-primary to-primary-dark text-white shadow-glow"
                  : "bg-amber-100 text-amber-400"
              }`}
            >
              {s}
            </div>
            {s < 2 && (
              <div
                className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${step > s ? "bg-primary" : "bg-amber-100"}`}
              />
            )}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <form onSubmit={handleNext} className="space-y-4">
          <Input
            label="Họ và tên"
            value={form.fullName}
            onChange={set("fullName")}
            placeholder="Nguyễn Văn A"
            required
            leftIcon={<User className="w-4 h-4" />}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="you@example.com"
            required
            leftIcon={<Mail className="w-4 h-4" />}
          />
          <Input
            label="Tên đăng nhập"
            value={form.username}
            onChange={set("username")}
            placeholder="nguyenvana"
            required
            leftIcon={<User className="w-4 h-4" />}
          />
          <Input
            label="Mật khẩu"
            type="password"
            value={form.password}
            onChange={set("password")}
            placeholder="••••••••"
            required
            hint="Tối thiểu 8 ký tự"
            leftIcon={<Lock className="w-4 h-4" />}
          />
          <Input
            label="Xác nhận mật khẩu"
            type="password"
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            placeholder="••••••••"
            required
            leftIcon={<ShieldCheck className="w-4 h-4" />}
          />

          {error && (
            <div className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50/80 border border-red-100 rounded-2xl px-4 py-3 animate-slide-up">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          <Button type="submit" fullWidth size="lg" className="shadow-lg shadow-primary/25">
            Tiếp theo
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Số điện thoại"
            type="tel"
            value={form.phone}
            onChange={set("phone")}
            placeholder="VD: 0901234567"
            pattern="(84|0[3|5|7|8|9])+([0-9]{8})\b"
            maxLength={10}
            leftIcon={<Phone className="w-4 h-4" />}
          />
          <Input
            label="Ngày sinh"
            type="date"
            value={form.dateOfBirth}
            onChange={set("dateOfBirth")}
            required
            hint="Phải từ 18 tuổi trở lên"
            max={maxDate}
            leftIcon={<Calendar className="w-4 h-4" />}
          />
          <Input
            label="Địa chỉ"
            value={form.address}
            onChange={set("address")}
            placeholder="123 Đường ABC, TP.HCM"
            leftIcon={<MapPin className="w-4 h-4" />}
          />

          {error && (
            <div className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50/80 border border-red-100 rounded-2xl px-4 py-3 animate-slide-up">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setStep(1);
                setError("");
              }}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>
            <Button type="submit" loading={loading} className="flex-1 shadow-lg shadow-primary/25">
              <CheckCircle className="w-5 h-5" />
              Đăng ký
            </Button>
          </div>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        Đã có tài khoản?{" "}
        <Link
          href="/auth/login"
          className="text-primary font-semibold hover:text-primary-dark hover:underline transition-all"
        >
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
