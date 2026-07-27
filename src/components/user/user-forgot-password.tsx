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
import BackButton from "../common/back-button"
import { AuthService } from "@/services/auth-service"
import { getErrorMessage } from "@/utils/error-helper"

export function UserForgotPassword({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({ email: ""});
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {

            const res = await AuthService.forgotPassword({email:form.email})
            if (res.data.success) {
                alert('we sent a reset link into your email')
                navigate('/login')
            }
        } catch (err) {
            alert(getErrorMessage(err)|| "Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    };


    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <BackButton />
                    <CardTitle>Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email address and we will send you a link to reset your password.
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
                                <Button className="cursor-pointer" type="submit" disabled={isLoading}>
                                    {isLoading ? "Sending..." : "Send Reset Link"}
                                </Button>
                            </Field>
                            
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
