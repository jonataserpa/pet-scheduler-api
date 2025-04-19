/**
 * Value Object que representa um contato (telefone, email, etc)
 * Value Objects são imutáveis e não possuem identidade
 */
export class Contact {
  private readonly _email: string;
  private readonly _phone: string;
  private readonly _whatsapp?: string;

  private constructor(email: string, phone: string, whatsapp?: string) {
    this._email = email;
    this._phone = phone;
    this._whatsapp = whatsapp;

    Object.freeze(this);
  }

  /**
   * Cria uma nova instância de Contact
   */
  public static create(email: string, phone: string, whatsapp?: string): Contact {
    // Validações
    if (!email || email.trim().length === 0) {
      throw new Error('Contato: email é obrigatório');
    }

    // Validação básica de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Contato: formato de email inválido');
    }

    if (!phone || phone.trim().length === 0) {
      throw new Error('Contato: telefone é obrigatório');
    }

    // Remove caracteres não numéricos do telefone
    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) { // Telefone fixo: DDD + número (mínimo 10 dígitos)
      throw new Error('Contato: telefone deve ter pelo menos 10 dígitos incluindo DDD');
    }

    // Se whatsapp for fornecido, valida e limpa
    let cleanedWhatsapp: string | undefined;
    if (whatsapp) {
      cleanedWhatsapp = whatsapp.replace(/\D/g, '');
      if (cleanedWhatsapp.length < 11) { // Whatsapp/Celular: DDD + 9 + número (11 dígitos)
        throw new Error('Contato: WhatsApp deve ter pelo menos 11 dígitos incluindo DDD');
      }
    }

    return new Contact(
      email.trim().toLowerCase(),
      cleanedPhone,
      cleanedWhatsapp,
    );
  }

  /**
   * Formata o telefone para exibição (ex: (11) 98765-4321)
   */
  public formatPhone(): string {
    const phone = this._phone;
    
    if (phone.length === 10) { // Fixo: (XX) XXXX-XXXX
      return `(${phone.substring(0, 2)}) ${phone.substring(2, 6)}-${phone.substring(6)}`;
    } else if (phone.length === 11) { // Celular: (XX) 9XXXX-XXXX
      return `(${phone.substring(0, 2)}) ${phone.substring(2, 7)}-${phone.substring(7)}`;
    }
    
    return phone; // Retorna como está se não conseguir formatar
  }

  /**
   * Formata o WhatsApp para exibição (ex: (11) 98765-4321)
   */
  public formatWhatsapp(): string {
    if (!this._whatsapp) {
      return '';
    }
    
    const whatsapp = this._whatsapp;
    
    if (whatsapp.length === 11) { // Celular: (XX) 9XXXX-XXXX
      return `(${whatsapp.substring(0, 2)}) ${whatsapp.substring(2, 7)}-${whatsapp.substring(7)}`;
    }
    
    return whatsapp; // Retorna como está se não conseguir formatar
  }

  /**
   * Retorna um objeto com os dados do contato
   */
  public toObject(): {
    email: string;
    phone: string;
    whatsapp?: string;
    formattedPhone: string;
    formattedWhatsapp: string;
  } {
    return {
      email: this._email,
      phone: this._phone,
      whatsapp: this._whatsapp,
      formattedPhone: this.formatPhone(),
      formattedWhatsapp: this.formatWhatsapp(),
    };
  }

  /**
   * Serializa o objeto para JSON
   */
  public toJSON(): string {
    return JSON.stringify(this.toObject());
  }

  /**
   * Deserializa um JSON para Contact
   */
  public static fromJSON(json: string): Contact {
    const data = JSON.parse(json);
    return Contact.create(data.email, data.phone, data.whatsapp);
  }

  // Getters
  get email(): string {
    return this._email;
  }

  get phone(): string {
    return this._phone;
  }

  get whatsapp(): string | undefined {
    return this._whatsapp;
  }

  /**
   * Compara dois contatos por igualdade de valores
   */
  public equals(other: Contact): boolean {
    if (!(other instanceof Contact)) {
      return false;
    }

    return (
      this._email === other._email &&
      this._phone === other._phone &&
      this._whatsapp === other._whatsapp
    );
  }
} 