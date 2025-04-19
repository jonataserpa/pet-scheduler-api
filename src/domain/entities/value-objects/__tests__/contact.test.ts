import { Contact } from '../contact.js';

describe('Contact Value Object', () => {
  const validEmail = 'test@example.com';
  const validPhone = '11987654321';
  const validWhatsapp = '11987654321';

  describe('create', () => {
    it('deve criar um Contact válido', () => {
      const contact = Contact.create(validEmail, validPhone);
      
      expect(contact.email).toBe(validEmail);
      expect(contact.phone).toBe(validPhone);
      expect(contact.whatsapp).toBeUndefined();
    });

    it('deve criar um Contact com WhatsApp', () => {
      const contact = Contact.create(validEmail, validPhone, validWhatsapp);
      
      expect(contact.email).toBe(validEmail);
      expect(contact.phone).toBe(validPhone);
      expect(contact.whatsapp).toBe(validWhatsapp);
    });

    it('deve normalizar o email para lowercase e trimmed', () => {
      const contact = Contact.create('  Test@Example.COM  ', validPhone);
      
      expect(contact.email).toBe('test@example.com');
    });

    it('deve remover caracteres não numéricos do telefone', () => {
      const contact = Contact.create(validEmail, '(11) 98765-4321');
      
      expect(contact.phone).toBe('11987654321');
    });

    it('deve remover caracteres não numéricos do WhatsApp', () => {
      const contact = Contact.create(validEmail, validPhone, '+55 (11) 98765-4321');
      
      expect(contact.whatsapp).toBe('5511987654321');
    });

    it('deve lançar erro se o email for vazio', () => {
      expect(() => Contact.create('', validPhone)).toThrow('Contato: email é obrigatório');
      expect(() => Contact.create('   ', validPhone)).toThrow('Contato: email é obrigatório');
    });

    it('deve lançar erro se o email for inválido', () => {
      expect(() => Contact.create('not-an-email', validPhone)).toThrow('Contato: formato de email inválido');
      expect(() => Contact.create('missing@domain', validPhone)).toThrow('Contato: formato de email inválido');
    });

    it('deve lançar erro se o telefone for vazio', () => {
      expect(() => Contact.create(validEmail, '')).toThrow('Contato: telefone é obrigatório');
      expect(() => Contact.create(validEmail, '   ')).toThrow('Contato: telefone é obrigatório');
    });

    it('deve lançar erro se o telefone for muito curto', () => {
      expect(() => Contact.create(validEmail, '123456789')).toThrow(
        'Contato: telefone deve ter pelo menos 10 dígitos incluindo DDD'
      );
    });

    it('deve lançar erro se o WhatsApp for muito curto', () => {
      expect(() => Contact.create(validEmail, validPhone, '12345678910')).not.toThrow();
      expect(() => Contact.create(validEmail, validPhone, '1234567890')).toThrow(
        'Contato: WhatsApp deve ter pelo menos 11 dígitos incluindo DDD'
      );
    });
  });

  describe('formatPhone', () => {
    it('deve formatar corretamente telefone fixo (10 dígitos)', () => {
      const contact = Contact.create(validEmail, '1122334455');
      
      expect(contact.formatPhone()).toBe('(11) 2233-4455');
    });

    it('deve formatar corretamente telefone celular (11 dígitos)', () => {
      const contact = Contact.create(validEmail, '11987654321');
      
      expect(contact.formatPhone()).toBe('(11) 98765-4321');
    });

    it('deve retornar o telefone original se não conseguir formatar', () => {
      // Telefone com formato não padrão (ex: internacional com mais dígitos)
      const contact = Contact.create(validEmail, '551122334455667788');
      
      expect(contact.formatPhone()).toBe('551122334455667788');
    });
  });

  describe('formatWhatsapp', () => {
    it('deve formatar corretamente o WhatsApp (11 dígitos)', () => {
      const contact = Contact.create(validEmail, validPhone, '11987654321');
      
      expect(contact.formatWhatsapp()).toBe('(11) 98765-4321');
    });

    it('deve retornar string vazia se não houver WhatsApp', () => {
      const contact = Contact.create(validEmail, validPhone);
      
      expect(contact.formatWhatsapp()).toBe('');
    });

    it('deve retornar o WhatsApp original se não conseguir formatar', () => {
      // WhatsApp com formato não padrão (ex: internacional com mais dígitos)
      const contact = Contact.create(validEmail, validPhone, '551122334455667788');
      
      expect(contact.formatWhatsapp()).toBe('551122334455667788');
    });
  });

  describe('toObject', () => {
    it('deve retornar um objeto com as propriedades corretas sem WhatsApp', () => {
      const contact = Contact.create(validEmail, validPhone);
      const obj = contact.toObject();
      
      expect(obj).toEqual({
        email: validEmail,
        phone: validPhone,
        whatsapp: undefined
      });
    });

    it('deve retornar um objeto com as propriedades corretas com WhatsApp', () => {
      const contact = Contact.create(validEmail, validPhone, validWhatsapp);
      const obj = contact.toObject();
      
      expect(obj).toEqual({
        email: validEmail,
        phone: validPhone,
        whatsapp: validWhatsapp
      });
    });
  });

  describe('equals', () => {
    it('deve identificar contatos iguais', () => {
      const contact1 = Contact.create(validEmail, validPhone, validWhatsapp);
      const contact2 = Contact.create(validEmail, validPhone, validWhatsapp);
      
      expect(contact1.equals(contact2)).toBe(true);
    });

    it('deve identificar contatos diferentes por email', () => {
      const contact1 = Contact.create(validEmail, validPhone);
      const contact2 = Contact.create('other@example.com', validPhone);
      
      expect(contact1.equals(contact2)).toBe(false);
    });

    it('deve identificar contatos diferentes por telefone', () => {
      const contact1 = Contact.create(validEmail, validPhone);
      const contact2 = Contact.create(validEmail, '11988887777');
      
      expect(contact1.equals(contact2)).toBe(false);
    });

    it('deve identificar contatos diferentes por WhatsApp', () => {
      const contact1 = Contact.create(validEmail, validPhone, validWhatsapp);
      const contact2 = Contact.create(validEmail, validPhone, '11988887777');
      
      expect(contact1.equals(contact2)).toBe(false);
    });

    it('deve identificar contatos diferentes pela presença de WhatsApp', () => {
      const contact1 = Contact.create(validEmail, validPhone);
      const contact2 = Contact.create(validEmail, validPhone, validWhatsapp);
      
      expect(contact1.equals(contact2)).toBe(false);
    });

    it('deve retornar false quando comparado com algo que não é Contact', () => {
      const contact = Contact.create(validEmail, validPhone);
      
      // @ts-expect-error testando com tipo inválido
      expect(contact.equals("not a contact")).toBe(false);
    });
  });
}); 