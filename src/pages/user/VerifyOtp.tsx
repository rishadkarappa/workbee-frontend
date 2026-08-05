import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { AuthHelper } from "@/utils/auth-helper"
import { AuthService } from "@/services/auth-service"
import { getErrorMessage } from "@/utils/error-helper"
import { toast } from "sonner"

const VerifyOtp = () => {
  const [otp, setOtp] = useState("")
  const [timeLeft, setTimeLeft] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  const navigate = useNavigate()

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft === 0) {
      setCanResend(true)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleResendOtp = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const userId = AuthHelper.getUserId()
    
    if (!userId) {
      toast.warning("User ID not found. Please register again.")
      navigate('/register')
      return
    }

    setIsResending(true)
    
    try {
      const res = await AuthService.resendOtp({ userId })
      
      if (res.data.success) {
        toast.success(res.data.message || 'OTP sent successfully to your email')
        setTimeLeft(60)
        setCanResend(false)
        setOtp("")
      } else {
        toast.error(res.data.message || 'Failed to resend OTP')
      }
    } catch (error: unknown) {
      console.error(error)
      toast.error(getErrorMessage(error))
    } finally {
      setIsResending(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const userId = AuthHelper.getUserId()

    if (!userId) {
      alert("User ID not found. Please register again.")
      navigate('/register')
      return
    }

    if (otp.length !== 5) {
      toast.error("Please enter complete 5-digit OTP")
      return
    }

    setIsVerifying(true)

    try {
      const res = await AuthService.verifyOtp({ userId, otp })

      if (res.data.success) {
        const { accessToken, refreshToken, user } = res.data.data
        
        AuthHelper.setAuth(accessToken, refreshToken, user)
        
        toast.success(res.data.message || `Welcome${user.name}`,{description: `Welcome to WorkBee ${user.name}`})
        navigate('/')
      } else {
        toast.error(res.data.message || 'OTP verification failed')
      }
    } catch (error: unknown) {
      console.error(error)
      alert(getErrorMessage(error))
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Enter verification code</CardTitle>
          <CardDescription>We sent a 5-digit code to your email.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="otp">Verification code</FieldLabel>
                <div className="flex justify-center">
                  <InputOTP 
                    maxLength={5} 
                    id="otp" 
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    required
                  >
                    <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:text-xl">
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <FieldDescription className="text-center">
                  Enter the 5-digit code sent to your email.
                </FieldDescription>
              </Field>

              <FieldGroup>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={otp.length !== 5 || isVerifying}
                >
                  {isVerifying ? "Verifying..." : "Verify"}
                </Button>
                
                <FieldDescription className="text-center">
                  {canResend ? (
                    <>
                      Didn&apos;t receive the code?{" "}
                      <a 
                        href="#" 
                        onClick={handleResendOtp}
                        className="text-black hover:text-blue-800 font-medium underline"
                      >
                        {isResending ? "Sending..." : "Resend"}
                      </a>
                    </>
                  ) : (
                    <>
                      Didn&apos;t receive the code? Wait {formatTime(timeLeft)} to resend
                    </>
                  )}
                </FieldDescription>
              </FieldGroup>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default VerifyOtp
