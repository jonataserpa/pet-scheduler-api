/**
 * Tipo para representar um erro de domínio
 */
export interface DomainError {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Classe para representar o resultado de uma operação
 * que pode ser sucesso ou falha
 */
export class Result<T, E = DomainError> {
  private readonly _isSuccess: boolean;
  private readonly _error: E | null;
  private readonly _value: T | null;

  private constructor(isSuccess: boolean, error: E | null, value: T | null) {
    this._isSuccess = isSuccess;
    this._error = error;
    this._value = value;
  }

  /**
   * Verifica se o resultado é sucesso
   */
  public get isSuccess(): boolean {
    return this._isSuccess;
  }

  /**
   * Verifica se o resultado é falha
   */
  public get isFailure(): boolean {
    return !this._isSuccess;
  }

  /**
   * Obtém o valor em caso de sucesso
   * @throws Error se tentar acessar o valor de um resultado de falha
   */
  public get value(): T {
    if (!this._isSuccess) {
      throw new Error('Não é possível obter o valor de um resultado de falha');
    }
    
    return this._value as T;
  }

  /**
   * Obtém o erro em caso de falha
   * @throws Error se tentar acessar o erro de um resultado de sucesso
   */
  public get error(): E {
    if (this._isSuccess) {
      throw new Error('Não é possível obter o erro de um resultado de sucesso');
    }
    
    return this._error as E;
  }

  /**
   * Cria um resultado de sucesso
   */
  public static ok<T, E = DomainError>(value: T): Result<T, E> {
    return new Result<T, E>(true, null, value);
  }

  /**
   * Cria um resultado de falha
   */
  public static fail<T, E = DomainError>(error: E): Result<T, E> {
    return new Result<T, E>(false, error, null);
  }

  /**
   * Cria um resultado de falha com uma mensagem simples
   */
  public static failWithMessage<T>(message: string, code?: string): Result<T> {
    return this.fail<T>({ message, code } as DomainError);
  }

  /**
   * Executa um callback se o resultado for sucesso
   * @returns O mesmo resultado
   */
  public onSuccess(callback: (value: T) => void): Result<T, E> {
    if (this._isSuccess) {
      callback(this.value);
    }
    return this;
  }

  /**
   * Executa um callback se o resultado for falha
   * @returns O mesmo resultado
   */
  public onFailure(callback: (error: E) => void): Result<T, E> {
    if (!this._isSuccess) {
      callback(this.error);
    }
    return this;
  }

  /**
   * Mapeia o valor de sucesso para um novo valor
   * @returns Um novo resultado com o valor mapeado ou o mesmo erro em caso de falha
   */
  public map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._isSuccess) {
      return Result.ok<U, E>(fn(this.value));
    } else {
      return Result.fail<U, E>(this.error);
    }
  }

  /**
   * Tenta executar uma operação que pode falhar e retorna um Result
   * @param fn Função a ser executada
   * @returns Result representando o resultado da operação
   */
  public static try<T>(fn: () => T): Result<T> {
    try {
      const value = fn();
      return Result.ok<T>(value);
    } catch (error) {
      const domainError: DomainError = {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error
      };
      return Result.fail<T>(domainError);
    }
  }

  /**
   * Tenta executar uma operação assíncrona que pode falhar e retorna um Result
   * @param fn Função assíncrona a ser executada
   * @returns Promise de Result representando o resultado da operação
   */
  public static async tryAsync<T>(fn: () => Promise<T>): Promise<Result<T>> {
    try {
      const value = await fn();
      return Result.ok<T>(value);
    } catch (error) {
      const domainError: DomainError = {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error
      };
      return Result.fail<T>(domainError);
    }
  }
} 