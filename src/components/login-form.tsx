"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AlertCircle, Mail, Lock, Loader2, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Form validation schema using Zod
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

type FormData = z.infer<typeof formSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (response?.error) {
        setError(`${response?.error}: wrong email or password.`);
        return;
      }

      // Successful login - redirect to dashboard or home page
      router.refresh();
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="relative rounded-[26px] bg-gradient-to-br from-blue-300/50 via-white/60 to-blue-200/50 p-[1.5px] shadow-2xl shadow-blue-900/10 dark:from-blue-500/25 dark:via-transparent dark:to-blue-500/20">
        <Card className="rounded-[24px] border-none bg-card/95 backdrop-blur-sm">
          <CardHeader className="justify-items-center text-center">
            <img
              src="/images/tsi-logo.png"
              alt="TSI Logo"
              className="mx-auto mb-3 h-30 w-auto"
            />
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Log in with your email and password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-5">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500/70" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      className="h-11 rounded-xl pl-10"
                      {...register("email")}
                      aria-invalid={!!errors.email}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm font-medium text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500/70" />
                    <Input
                      id="password"
                      type="password"
                      className="h-11 rounded-xl pl-10"
                      {...register("password")}
                      aria-invalid={!!errors.password}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm font-medium text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="h-11 w-full scale-100 rounded-xl bg-gradient-to-r from-[#0a1f44] to-blue-600 text-white shadow-lg shadow-blue-600/25 transition-transform hover:cursor-pointer hover:opacity-90 active:scale-[0.98]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Login
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
