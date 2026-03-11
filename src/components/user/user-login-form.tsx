import { cn } from "@/lib/utils"
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
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import BackButton from "../common/back-button"
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { AuthService } from "@/services/auth-service"
import { AuthHelper } from "@/utils/auth-helper"
import { useBlockedMessage } from "@/hooks/useBlockedMessage"

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {

    const [form, setForm] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const blockedMessage = useBlockedMessage();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await AuthService.login(form);

            if (res.data.success) {
                const { accessToken, refreshToken, user } = res.data.data;

                if (accessToken && refreshToken && user) {
                    if (user.role !== "user") {
                        alert("Access denied. Please use the correct login page.");
                        return;
                    }

                    AuthHelper.setAuth(accessToken, refreshToken, user);
                    alert(res.data.message || "Login Successful");
                    navigate("/");
                } else {
                    alert("Login failed - Invalid response");
                }
            } else {
                alert(res.data.message || "Login failed");
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    // Google auth
    const handleGoogleAuthLogin = async (credentialResponse: any) => {
        try {
            const res = await AuthService.googleAuthLogin({
                credential: credentialResponse.credential
            });

            if (res.data.success) {
                const { accessToken, refreshToken, user } = res.data.data;

                if (accessToken && refreshToken && user) {
                    AuthHelper.setAuth(accessToken, refreshToken, user);
                    alert(res.data.message || "Google Auth Successful");

                    if (user.role === 'admin') {
                        navigate('/admin/dashboard');
                    } else if (user.role === 'worker') {
                        navigate('/worker/worker-dashboard');
                    } else {
                        navigate('/');
                    }
                } else {
                    alert("Google Auth failed - Invalid response");
                }
            } else {
                alert(res.data.message || "Google Auth Failed");
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Google Login Failed");
        }
    };



    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>

            {/* make this a sweet alert in futer */}
            {blockedMessage && (
                <div className="bg-green-50 border border-green-300 text-black text-xs px-3 py-2 rounded mb-2 w-fit">
                    {blockedMessage}
                    <a
                        href="mailto:workbee.support@mail.com"
                        className="text-black-10 underline ml-1"
                    >
                        workbee.support@mail.com
                    </a>
                </div>
            )}

            <Card>
                <CardHeader>
                    <BackButton />
                    <CardTitle>Login</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="rishad@example.com"
                                    required
                                />
                            </Field>
                            <Field>
                                <div className="flex items-center">
                                    <FieldLabel htmlFor="password">Password</FieldLabel>
                                    <a
                                        onClick={() => navigate("/forgot-password")}
                                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline cursor-pointer"
                                    >
                                        Forgot your password?
                                    </a>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={form.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </Field>
                            <Field>
                                <Button className="cursor-pointer" type="submit" disabled={isLoading}>
                                    {isLoading ? "Signing in..." : "Login"}
                                </Button>
                            </Field>

                            {/* google auth */}
                            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                                <GoogleLogin
                                    onSuccess={handleGoogleAuthLogin}
                                    onError={() => alert('Google login failed')}
                                />
                            </GoogleOAuthProvider>


                            <div className="mt-4 text-center text-sm">
                                Don&apos;t have an account?{' '}
                                <a
                                    className="underline underline-offset-4 cursor-pointer"
                                    onClick={() => navigate("/register")}
                                >
                                    Sign up
                                </a>
                                <div className="mt-4 text-center text-sm">
                                    Are you a worker?{" "}
                                    <a
                                        className="underline underline-offset-4 cursor-pointer"
                                        onClick={() => navigate("/worker/worker-login")}
                                    >
                                        Click Here
                                    </a>
                                </div>
                                <div className="mt-4 text-center text-sm">
                                    Apply to become a worker?{" "}
                                    <a
                                        className="underline underline-offset-4 cursor-pointer"
                                        onClick={() => navigate("/worker/apply-worker")}
                                    >
                                        Click Here
                                    </a>
                                </div>
                            </div>

                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
