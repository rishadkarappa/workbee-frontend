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
import { GoogleLogin, GoogleOAuthProvider, type CredentialResponse } from '@react-oauth/google';
import { AuthService } from "@/services/auth-service"
import { AuthHelper } from "@/utils/auth-helper"
import { useBlockedMessage } from "@/hooks/useBlockedMessage"
import { getErrorMessage } from "@/utils/error-helper"
import { AppRoutes } from "@/constants/routes/app-routes"
import { toast } from "sonner"
import { emailRegex } from "@/constants/regex/regex"

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
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    };

    const [errors, setErrors] = useState({ email: "", password: "" })
    const validateForm = () => {
        const newErrors = {
            email: "",
            password: "",
        };

        let isValid = true;

        if (!form.email.trim()) {
            newErrors.email = "Email is required";
            isValid = false;
        } else if (!emailRegex.validEmail.test(form.email)) {
            newErrors.email = "Please enter a valid email address";
            isValid = false;
        }

        if (!form.password.trim()) {
            newErrors.password = "Password is required";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const res = await AuthService.login(form);

            if (res.data.success) {
                const { accessToken, refreshToken, user } = res.data.data;

                if (accessToken && refreshToken && user) {
                    if (user.role !== "user") {
                        toast.error("Access denied. Please use the correct login page.");
                        return;
                    }

                    AuthHelper.setAuth(accessToken, refreshToken, user);
                    toast.success("Logged Successfully")
                    navigate(AppRoutes.USER.HOME);
                } else {
                    toast.error("Login failed - Invalid response");
                }
            } else {
                console.log(res.data.message)
                toast.error("Login failed");
            }
        } catch (err) {
            toast.error(getErrorMessage(err) || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    // Google auth
    const handleGoogleAuthLogin = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) {
            alert("Google login failed no credential returned");
            return;
        }
        try {
            const res = await AuthService.googleAuthLogin({
                credential: credentialResponse.credential
            });


            if (res.data.success) {
                const { accessToken, refreshToken, user } = res.data.data;

                if (accessToken && refreshToken && user) {
                    AuthHelper.setAuth(accessToken, refreshToken, user);
                    toast.success("Google Auth Successful")
                    if (user.role === 'admin') {
                        navigate('/admin/dashboard');
                    } else if (user.role === 'worker') {
                        navigate('/worker/worker-dashboard');
                    } else {
                        navigate('/');
                    }
                } else {
                    toast.error("Google Auth failed - Invalid response");
                }
            } else {
                toast.error(res.data.message || "Google Auth Failed");
            }
        } catch (err) {
            toast.error(getErrorMessage(err) || "Google Login Failed");
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
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="rishad@example.com"

                                />
                                {errors.email && (
                                    <p className="mt-0 text-xs text-red-800">
                                        {errors.email}
                                    </p>
                                )}
                            </Field>
                            <Field>
                                <div className="flex items-center">
                                    <FieldLabel htmlFor="password">Password</FieldLabel>
                                    <a
                                        onClick={() => navigate(AppRoutes.USER.FORGOT_PASSWORD)}
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

                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-red-800">
                                        {errors.password}
                                    </p>
                                )}
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
                                    onClick={() => navigate(AppRoutes.USER.REGISTER)}
                                >
                                    Sign up
                                </a>
                                <div className="mt-4 text-center text-sm">
                                    Are you a worker?{" "}
                                    <a
                                        className="underline underline-offset-4 cursor-pointer"
                                        onClick={() => navigate(AppRoutes.WORKER.LOGIN)}
                                    >
                                        Click Here
                                    </a>
                                </div>
                                <div className="mt-4 text-center text-sm">
                                    Apply to become a worker?{" "}
                                    <a
                                        className="underline underline-offset-4 cursor-pointer"
                                        onClick={() => navigate(AppRoutes.WORKER.APPLY)}
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
