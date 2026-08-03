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
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import BackButton from "../common/back-button"
import { AuthService } from "@/services/auth-service"
import { AuthHelper } from "@/utils/auth-helper"
import { useBlockedMessage } from "@/hooks/useBlockedMessage"
import { getErrorMessage } from "@/utils/error-helper"

export function WorkerLoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({
        email: "",
        password: "",
    });
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

    const validate = () => {
        const newErrors = {
            email: "",
            password: "",
        };

        let isValid = true;

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

        setErrors(newErrors);
        return isValid;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsLoading(true);

        try {
            const data = {
                email: form.email,
                password: form.password,
            };
            const result = await AuthService.workerLogin(data);

            if (result.data.success) {
                const { accessToken, refreshToken, worker } = result.data.data;

                if (accessToken && refreshToken && worker) {
                    if (worker.role !== "worker") {
                        alert("Access denied. Worker privileges required.");
                        return;
                    }

                    AuthHelper.setAuth(accessToken, refreshToken, worker);

                    alert(result.data.message || "Worker login successful");
                    navigate("/worker/worker-dashboard");
                } else {
                    alert("Login failed - Invalid response");
                }
            } else {
                alert(result.data.message || "Login failed");
            }
        } catch (err) {
            console.error('Worker login error:', err);
            alert(getErrorMessage(err));
        } finally {
            setIsLoading(false);
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
                    <CardTitle>Worker Login</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your workbee worker dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="worker@example.com"
                                />

                                {errors.email && (
                                    <p className="text-xs text-red-800">
                                        {errors.email}
                                    </p>
                                )}
                            </Field>
                            <Field>
                                <div className="flex items-center">
                                    <FieldLabel htmlFor="password">Password</FieldLabel>
                                    {/* <a
                                        href="#"
                                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                    >
                                        Forgot your password?
                                    </a> */}
                                </div>

                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                        className="pr-10"
                                    />

                                    {errors.password && (
                                        <p className="mt-1 text-xs text-red-800">
                                            {errors.password}
                                        </p>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </Field>

                            <Field>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? "Logging in..." : "Login to worker dashboard"}
                                </Button>
                            </Field>
                        </FieldGroup>
                        <div className="mt-4 text-center text-sm">
                            <div className="mt-7 text-center text-sm">
                                Apply to become a worker?{" "}
                                <a
                                    className="underline underline-offset-4 cursor-pointer"
                                    onClick={() => navigate("/worker/apply-worker")}
                                >
                                    Click Here
                                </a>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}