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
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import BackButton from "../common/back-button"
import { GoogleLogin, GoogleOAuthProvider, type CredentialResponse } from "@react-oauth/google"
import { AuthService } from "@/services/auth-service"
import { AuthHelper } from "@/utils/auth-helper"
import { getErrorMessage } from "@/utils/error-helper"

export function RegisterForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()
    const [errors, setErrors] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setForm((prev) => ({
            ...prev,
            [name]: value
        }))
        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }))
    }

    const validate = () => {
        const newErrors = {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        };

        let isValid = true;

        if (!form.name.trim()) {
            newErrors.name = "Full name is required";
            isValid = false;
        } else if (form.name.trim().length < 3) {
            newErrors.name = "Name must be at least 3 characters";
            isValid = false;
        }

        if (!form.email.trim()) {
            newErrors.email = "Email is required";
            isValid = false;
        } else if (
            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(form.email)
        ) {
            newErrors.email = "Enter a valid email address";
            isValid = false;
        }

        if (!form.password) {
            newErrors.password = "Password is required";
            isValid = false;
        } else if (form.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
            isValid = false;
        }

        if (!form.confirmPassword) {
            newErrors.confirmPassword = "Confirm your password";
            isValid = false;
        } else if (form.password !== form.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validate()) {
            return
        }

        setIsLoading(true)
        try {
            const registrationData = { name: form.name, email: form.email, password: form.password, };
            const res = await AuthService.register(registrationData);
            if (res.data.success) {
                AuthHelper.setUserId(res.data.data.userId);
                alert(res.data.message);
                navigate("/otp");
            } else {
                alert(res.data.message || "Registration failed");
            }
        } catch (err) {
            console.error(err);
            alert(getErrorMessage(err) || "Registration failed");
        } finally {
            setIsLoading(false);
        }
    }

    // google auth
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
        } catch (err) {
            alert(getErrorMessage(err) || "Google Login Failed");
        }
    };


    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <BackButton />
                    <CardTitle>Register</CardTitle>
                    <CardDescription>
                        Create your account to get started
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Full name"
                                />
                                {errors.name && (
                                    <p className="text-xs text-red-700">{errors.name}</p>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="Email address"
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-700">{errors.email}</p>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="password">Password</FieldLabel>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Password"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                    {errors.password && (
                                        <p className="text-xs text-red-700">{errors.password}</p>
                                    )}
                                </div>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-xs text-red-700">
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </Field>

                            <Field>
                                <Button
                                    className="cursor-pointer"
                                    type="submit"
                                    disabled={
                                        isLoading ||
                                        !!(form.password &&
                                            form.confirmPassword &&
                                            form.password !== form.confirmPassword)
                                    }
                                >
                                    {isLoading ? "Creating Account..." : "Sign up"}
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
                                Already have any account?{' '}
                                <a
                                    className="underline underline-offset-4 cursor-pointer"
                                    onClick={() => navigate("/login")}
                                >
                                    Login
                                </a>
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
