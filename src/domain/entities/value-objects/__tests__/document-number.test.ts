import { DocumentNumber, DocumentType } from '../document-number.js';

describe('DocumentNumber', () => {
  describe('create', () => {
    it('should create a valid DocumentNumber for CPF', () => {
      const cpf = DocumentNumber.create('123.456.789-09');
      expect(cpf).toBeDefined();
      expect(cpf.type).toBe(DocumentType.CPF);
      expect(cpf.value).toBe('12345678909');
    });

    it('should create a valid DocumentNumber for CNPJ', () => {
      const cnpj = DocumentNumber.create('12.345.678/0001-95');
      expect(cnpj).toBeDefined();
      expect(cnpj.type).toBe(DocumentType.CNPJ);
      expect(cnpj.value).toBe('12345678000195');
    });

    it('should throw error if document is empty', () => {
      expect(() => {
        DocumentNumber.create('');
      }).toThrow('DocumentNumber: documento é obrigatório');
    });

    it('should throw error if document has invalid length', () => {
      expect(() => {
        DocumentNumber.create('1234567890');
      }).toThrow('DocumentNumber: documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)');
    });

    it('should throw error for invalid CPF', () => {
      expect(() => {
        DocumentNumber.create('111.111.111-11');
      }).toThrow('DocumentNumber: CPF inválido');
    });

    it('should throw error for invalid CNPJ', () => {
      expect(() => {
        DocumentNumber.create('11.111.111/1111-11');
      }).toThrow('DocumentNumber: CNPJ inválido');
    });
  });

  describe('createCPF', () => {
    it('should create a valid CPF', () => {
      const cpf = DocumentNumber.createCPF('123.456.789-09');
      expect(cpf).toBeDefined();
      expect(cpf.type).toBe(DocumentType.CPF);
      expect(cpf.value).toBe('12345678909');
    });

    it('should throw error if CPF is empty', () => {
      expect(() => {
        DocumentNumber.createCPF('');
      }).toThrow('DocumentNumber: CPF é obrigatório');
    });

    it('should throw error if CPF has invalid length', () => {
      expect(() => {
        DocumentNumber.createCPF('1234567890');
      }).toThrow('DocumentNumber: CPF deve ter 11 dígitos');
    });

    it('should throw error for invalid CPF', () => {
      expect(() => {
        DocumentNumber.createCPF('111.111.111-11');
      }).toThrow('DocumentNumber: CPF inválido');
    });
  });

  describe('createCNPJ', () => {
    it('should create a valid CNPJ', () => {
      const cnpj = DocumentNumber.createCNPJ('12.345.678/0001-95');
      expect(cnpj).toBeDefined();
      expect(cnpj.type).toBe(DocumentType.CNPJ);
      expect(cnpj.value).toBe('12345678000195');
    });

    it('should throw error if CNPJ is empty', () => {
      expect(() => {
        DocumentNumber.createCNPJ('');
      }).toThrow('DocumentNumber: CNPJ é obrigatório');
    });

    it('should throw error if CNPJ has invalid length', () => {
      expect(() => {
        DocumentNumber.createCNPJ('123456780001');
      }).toThrow('DocumentNumber: CNPJ deve ter 14 dígitos');
    });

    it('should throw error for invalid CNPJ', () => {
      expect(() => {
        DocumentNumber.createCNPJ('11.111.111/1111-11');
      }).toThrow('DocumentNumber: CNPJ inválido');
    });
  });

  describe('format', () => {
    it('should format CPF correctly', () => {
      const cpf = DocumentNumber.createCPF('12345678909');
      expect(cpf.format()).toBe('123.456.789-09');
    });

    it('should format CNPJ correctly', () => {
      const cnpj = DocumentNumber.createCNPJ('12345678000195');
      expect(cnpj.format()).toBe('12.345.678/0001-95');
    });
  });

  describe('getValue', () => {
    it('should return unformatted CPF value', () => {
      const cpf = DocumentNumber.createCPF('123.456.789-09');
      expect(cpf.getValue()).toBe('12345678909');
    });

    it('should return unformatted CNPJ value', () => {
      const cnpj = DocumentNumber.createCNPJ('12.345.678/0001-95');
      expect(cnpj.getValue()).toBe('12345678000195');
    });
  });

  describe('getType', () => {
    it('should return CPF type', () => {
      const cpf = DocumentNumber.createCPF('123.456.789-09');
      expect(cpf.getType()).toBe(DocumentType.CPF);
    });

    it('should return CNPJ type', () => {
      const cnpj = DocumentNumber.createCNPJ('12.345.678/0001-95');
      expect(cnpj.getType()).toBe(DocumentType.CNPJ);
    });
  });

  describe('toObject', () => {
    it('should convert CPF to object correctly', () => {
      const cpf = DocumentNumber.createCPF('123.456.789-09');
      const obj = cpf.toObject();
      expect(obj).toEqual({
        value: '12345678909',
        type: DocumentType.CPF,
        formatted: '123.456.789-09'
      });
    });

    it('should convert CNPJ to object correctly', () => {
      const cnpj = DocumentNumber.createCNPJ('12.345.678/0001-95');
      const obj = cnpj.toObject();
      expect(obj).toEqual({
        value: '12345678000195',
        type: DocumentType.CNPJ,
        formatted: '12.345.678/0001-95'
      });
    });
  });

  describe('toJSON and fromJSON', () => {
    it('should serialize and deserialize CPF correctly', () => {
      const cpf = DocumentNumber.createCPF('123.456.789-09');
      const json = cpf.toJSON();
      const deserializedCpf = DocumentNumber.fromJSON(json);
      expect(deserializedCpf.equals(cpf)).toBe(true);
    });

    it('should serialize and deserialize CNPJ correctly', () => {
      const cnpj = DocumentNumber.createCNPJ('12.345.678/0001-95');
      const json = cnpj.toJSON();
      const deserializedCnpj = DocumentNumber.fromJSON(json);
      expect(deserializedCnpj.equals(cnpj)).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true if CPF documents are equal', () => {
      const cpf1 = DocumentNumber.createCPF('123.456.789-09');
      const cpf2 = DocumentNumber.createCPF('123.456.789-09');
      expect(cpf1.equals(cpf2)).toBe(true);
    });

    it('should return true if CNPJ documents are equal', () => {
      const cnpj1 = DocumentNumber.createCNPJ('12.345.678/0001-95');
      const cnpj2 = DocumentNumber.createCNPJ('12.345.678/0001-95');
      expect(cnpj1.equals(cnpj2)).toBe(true);
    });

    it('should return false if documents are different', () => {
      const cpf = DocumentNumber.createCPF('123.456.789-09');
      const cnpj = DocumentNumber.createCNPJ('12.345.678/0001-95');
      expect(cpf.equals(cnpj)).toBe(false);
    });

    it('should return false if comparing with non-DocumentNumber object', () => {
      const cpf = DocumentNumber.createCPF('123.456.789-09');
      // @ts-expect-error: Testing with invalid type
      expect(cpf.equals({})).toBe(false);
    });
  });

  // Testando casos específicos de validação
  describe('CPF validation', () => {
    it('should accept valid CPF with different formatting', () => {
      // Sem formatação
      expect(() => DocumentNumber.createCPF('12345678909')).not.toThrow();
      // Com formatação padrão
      expect(() => DocumentNumber.createCPF('123.456.789-09')).not.toThrow();
      // Com outros caracteres não numéricos
      expect(() => DocumentNumber.createCPF('123 456-789 09')).not.toThrow();
    });
    
    it('should reject CPF with all digits the same', () => {
      expect(() => DocumentNumber.createCPF('111.111.111-11')).toThrow();
      expect(() => DocumentNumber.createCPF('000.000.000-00')).toThrow();
    });
  });

  describe('CNPJ validation', () => {
    it('should accept valid CNPJ with different formatting', () => {
      // Sem formatação
      expect(() => DocumentNumber.createCNPJ('12345678000195')).not.toThrow();
      // Com formatação padrão
      expect(() => DocumentNumber.createCNPJ('12.345.678/0001-95')).not.toThrow();
      // Com outros caracteres não numéricos
      expect(() => DocumentNumber.createCNPJ('12 345 678/0001 95')).not.toThrow();
    });
    
    it('should reject CNPJ with all digits the same', () => {
      expect(() => DocumentNumber.createCNPJ('11.111.111/1111-11')).toThrow();
      expect(() => DocumentNumber.createCNPJ('00.000.000/0000-00')).toThrow();
    });
  });
}); 