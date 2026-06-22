
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
  FormDescription,
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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z
    .string()
    .min(1, 'O e-mail é obrigatório.')
    .transform((v) => v.trim().toLowerCase())
    .refine((v) => v.length > 0, {
      message: 'O e-mail é obrigatório.',
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
    setLoading(false);
  }

  return (
    <Card className="border border-border bg-card shadow-md">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-xl font-semibold text-foreground">
          Acesse sua Conta
        </CardTitle>
        <CardDescription>
          Use seu e-mail e senha para acessar a plataforma.
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
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="seu@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    O acesso é feito somente com e-mail e senha.
                  </FormDescription>
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
