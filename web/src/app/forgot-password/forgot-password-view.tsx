
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFirebase } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { PublicAuthLayout } from '@/components/auth/public-auth-layout';

const formSchema = z.object({
  email: z.string().email('Por favor, insira um e-mail válido.'),
});

type FormValues = z.infer<typeof formSchema>;

export function ForgotPasswordView() {
  const [loading, setLoading] = React.useState(false);
  const { auth } = useFirebase();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Erro de Serviço',
        description: 'Serviço de autenticação não está disponível.',
      });
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, values.email);
      toast({
        title: 'Email Enviado!',
        description:
          'Verifique sua caixa de entrada para o link de redefinição de senha.',
      });
      form.reset();
    } catch (error: unknown) {
      console.error('Password reset error:', error);
      let description =
        'Ocorreu um erro. Verifique o e-mail e tente novamente.';
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'auth/user-not-found'
      ) {
        description = 'Nenhum usuário encontrado com este e-mail.';
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao Enviar Email',
        description,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicAuthLayout>
      <div className="space-y-6">
        <Card className="border border-border bg-card shadow-md">
          <CardHeader className="space-y-1.5">
            <CardTitle className="text-xl">Recuperar Senha</CardTitle>
            <CardDescription>
              Insira seu e-mail para receber um link de redefinição de senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="seu@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar e-mail de recuperação'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center text-sm">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 text-muted-foreground underline underline-offset-2 transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para o login
          </Link>
        </div>
      </div>
    </PublicAuthLayout>
  );
}
