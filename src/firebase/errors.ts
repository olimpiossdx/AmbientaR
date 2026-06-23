'use client';
import { getAuth, type User } from 'firebase/auth';

type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

interface FirebaseAuthToken {
  name: string | null;
  email: string | null;
  email_verified: boolean;
  phone_number: string | null;
  sub: string;
  firebase: {
    identities: Record<string, string[]>;
    sign_in_provider: string;
    tenant: string | null;
  };
}

interface FirebaseAuthObject {
  uid: string;
  token: FirebaseAuthToken;
}

interface SecurityRuleRequest {
  auth: FirebaseAuthObject | null;
  method: string;
  path: string;
  resource?: {
    data: any;
  };
}

/**
 * Builds a security-rule-compliant auth object from the Firebase User.
 * @param currentUser The currently authenticated Firebase user.
 * @returns An object that mirrors request.auth in security rules, or null.
 */
function buildAuthObject(currentUser: User | null): FirebaseAuthObject | null {
  if (!currentUser) {
    return null;
  }

  const token: FirebaseAuthToken = {
    name: currentUser.displayName,
    email: currentUser.email,
    email_verified: currentUser.emailVerified,
    phone_number: currentUser.phoneNumber,
    sub: currentUser.uid,
    firebase: {
      identities: currentUser.providerData.reduce((acc, p) => {
        if (p.providerId) {
          acc[p.providerId] = [p.uid];
        }
        return acc;
      }, {} as Record<string, string[]>),
      sign_in_provider: currentUser.providerData[0]?.providerId || 'custom',
      tenant: currentUser.tenantId,
    },
  };

  return {
    uid: currentUser.uid,
    token: token,
  };
}

/**
 * Builds the complete, simulated request object for the error message.
 * It safely tries to get the current authenticated user.
 * @param context The context of the failed Firestore operation.
 * @returns A structured request object.
 */
function buildRequestObject(context: SecurityRuleContext): SecurityRuleRequest {
  let authObject: FirebaseAuthObject | null = null;
  try {
    // Safely attempt to get the current user.
    const firebaseAuth = getAuth();
    const currentUser = firebaseAuth.currentUser;
    if (currentUser) {
      authObject = buildAuthObject(currentUser);
    }
  } catch {
    // This will catch errors if the Firebase app is not yet initialized.
    // In this case, we'll proceed without auth information.
  }

  return {
    auth: authObject,
    method: context.operation,
    path: `/databases/(default)/documents/${context.path}`,
    resource: context.requestResourceData ? { data: context.requestResourceData } : undefined,
  };
}

function buildDebugPayload(requestObject: SecurityRuleRequest): string {
  return JSON.stringify(requestObject, null, 2);
}

const USER_FRIENDLY_PERMISSION_MESSAGE =
  'Sem permissão para acessar ou gravar estes dados. Verifique seu perfil ou contacte o administrador.';

/**
 * Erro estruturado para falhas de regras Firestore.
 * A mensagem exposta ao utilizador é curta; o payload completo fica em `debugPayload`.
 */
export class FirestorePermissionError extends Error {
  public readonly request: SecurityRuleRequest;
  public readonly debugPayload: string;
  public readonly operation: SecurityRuleContext['operation'];

  constructor(context: SecurityRuleContext) {
    const requestObject = buildRequestObject(context);
    super(USER_FRIENDLY_PERMISSION_MESSAGE);
    this.name = 'FirestorePermissionError';
    this.request = requestObject;
    this.debugPayload = buildDebugPayload(requestObject);
    this.operation = context.operation;
  }
}

/** Mensagem segura para boundaries e toasts (nunca JSON de debug). */
export function getUserFacingErrorMessage(error: unknown): string {
  if (error instanceof FirestorePermissionError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    if (error.message.includes('Missing or insufficient permissions')) {
      return USER_FRIENDLY_PERMISSION_MESSAGE;
    }
    if (error.message.trim().startsWith('{') || error.message.includes('"auth"')) {
      return 'Ocorreu um erro de permissão ou comunicação. Tente novamente ou contacte o suporte.';
    }
    return error.message;
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
