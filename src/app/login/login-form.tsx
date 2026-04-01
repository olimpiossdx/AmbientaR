
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/firebase';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z
    .string()
    .min(1, 'O campo de usuário é obrigatório.')
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, {
      message: 'O campo de usuário é obrigatório.',
    })
    .refine((v) => /\S+@\S+\.\S+/.test(v), {
      message: 'Informe um e-mail válido.',
    }),
  password: z
    .string()
    .min(6, 'A senha deve ter no mínimo 6 caracteres.')
    .transform((v) => v.trim()),
});

type FormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const [loading, setLoading] = React.useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    const success = await login(values.email, values.password);
    if (success) {
        toast({
        title: 'Login bem-sucedido!',
        description: 'Bem-vindo de volta!',
        });
    }
    // Error toast is handled within the login function now
    // Redirect is also handled within the login function
    setLoading(false);
  }

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">
          Acesse sua Conta
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Insira suas credenciais para entrar no sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuário ou Email</FormLabel>
                  <FormControl>
                    <Input placeholder="adm@adm.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
