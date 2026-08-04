import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import BackButton from "../common/back-button";
import { AuthService } from "@/services/auth-service";
import { getErrorMessage } from "@/utils/error-helper";
import { AppRoutes } from "@/constants/routes/app-routes";
import { toast } from "sonner";

export function UserResetPassword() {
  const { token } = useParams();

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });

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
      password: "",
      confirmPassword: "",
    };

    let isValid = true;

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
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      const res = await AuthService.resetPassword(token!, {
        password: form.password,
      });
      if (res.data.success) {
        toast.success("Password reset successfully!");
        navigate(AppRoutes.USER.LOGIN);
      }
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-10">
      <CardHeader>
        <BackButton />
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>Enter a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>New Password</FieldLabel>
              <Input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="text-xs text-red-800">
                  {errors.password}
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel>Confirm Password</FieldLabel>
              <Input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-800">
                  {errors.confirmPassword}
                </p>
              )}
            </Field>
            <Field>
              <Button type="submit" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
