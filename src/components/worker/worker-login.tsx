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

export function WorkerLoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const blockedMessage = useBlockedMessage();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const data = { email, password };
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
        } catch (err: any) {
            console.error('Worker login error:', err);
            alert(err.response?.data?.message || 'Login failed');
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
                    <BackButton/>
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
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="worker@example.com"
                                    required
                                />
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
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="Enter your password"
                                        className="pr-10" 
                                    />

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