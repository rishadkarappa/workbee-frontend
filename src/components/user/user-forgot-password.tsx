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
import { toast } from "sonner"
import { emailRegex } from "@/constants/regex/regex"

export function UserForgotPassword({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({ email: ""});
    const navigate = useNavigate();
    const [errors, setErrors] = useState({
        email:""
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target
        setForm((prev) => ({
            ...prev,
            [name]:value
        }))
        setErrors((prev) => ({
            ...prev,
            [name]:""
        }))
    };

    const validate = () => {
        const newErrors = {
            email:""
        }
        let isValid = true
        if(!form.email.trim()) {
            newErrors.email = "Email is required";
            isValid = false
        } else if(!emailRegex.validEmail.test(form.email)) {
            newErrors.email = "Enter a valid email address";
            isValid = false
        }
        setErrors(newErrors)
        return isValid;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if(!validate()) return;

        setIsLoading(true);


        try {

            const res = await AuthService.forgotPassword({email:form.email})
            if (res.data.success) {
                toast.success('we sent a reset link into your email')
                navigate('/login')
            }
        } catch (err) {
            toast.error(getErrorMessage(err)|| "Something went wrong. Please try again.")
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
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="rishad@example.com"
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-800">{errors.email}</p>
                                )}
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
