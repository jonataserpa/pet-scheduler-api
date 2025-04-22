import { Address } from "../address.js";

/**
 * Estrutura para os dados de retorno da API de CEP
 */
interface ZipCodeApiResponse {
	cep: string;
	logradouro: string;
	complemento: string;
	bairro: string;
	localidade: string;
	uf: string;
	ibge: string;
	gia: string;
	ddd: string;
	siafi: string;
}

/**
 * Fábrica para criação de objetos Address a partir de diferentes fontes
 */
export class AddressFactory {
	/**
	 * Cria um endereço a partir de um CEP brasileiro usando API externa
	 *
	 * Observação: Esta implementação simula a consulta à API. Em um ambiente real,
	 * seria necessário fazer uma requisição HTTP para a API de CEP.
	 */
	public static async createFromBrazilianZipCode(
		zipCode: string,
		number: string,
		complement?: string,
	): Promise<Address> {
		// Limpa o CEP, mantendo apenas dígitos
		const cleanZipCode = zipCode.replace(/\D/g, "");

		// Valida o formato do CEP brasileiro
		if (!/^\d{8}$/.test(cleanZipCode)) {
			throw new Error("CEP inválido. Deve conter 8 dígitos numéricos.");
		}

		try {
			// Em um ambiente real, este seria o código para chamar a API de CEP:
			// const response = await fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`);
			// const data = await response.json();

			// Simulação da resposta de API para fins de demonstração
			const data = await AddressFactory.mockZipCodeApiCall(cleanZipCode);

			if (data.erro) {
				throw new Error("CEP não encontrado na base de dados.");
			}

			return Address.create(
				data.logradouro || "[Endereço não informado]", // A API pode retornar campos vazios para alguns CEPs
				number,
				data.bairro || "[Bairro não informado]",
				data.localidade,
				data.uf,
				data.cep,
				"Brasil", // País é sempre Brasil para CEPs brasileiros
				complement,
			);
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Erro ao consultar CEP: ${error.message}`);
			}
			throw new Error("Erro ao consultar CEP");
		}
	}

	/**
	 * Método auxiliar para criar o endereço com base no mapa de estados
	 */
	public static createFromApiResponse(
		apiData: ZipCodeApiResponse,
		number: string,
		complement?: string,
	): Address {
		return Address.create(
			apiData.logradouro || "[Endereço não informado]",
			number,
			apiData.bairro || "[Bairro não informado]",
			apiData.localidade,
			apiData.uf,
			apiData.cep,
			"Brasil",
			complement || apiData.complemento,
		);
	}

	/**
	 * Cria um endereço completo a partir de todos os campos
	 */
	public static createComplete(
		street: string,
		number: string,
		neighborhood: string,
		city: string,
		state: string,
		zipCode: string,
		country: string,
		complement?: string,
	): Address {
		return Address.create(street, number, neighborhood, city, state, zipCode, country, complement);
	}

	/**
	 * Simula uma chamada à API de CEP para fins de demonstração
	 * Em um ambiente real, este método seria substituído por uma requisição HTTP
	 */
	private static async mockZipCodeApiCall(
		zipCode: string,
	): Promise<ZipCodeApiResponse & { erro?: boolean }> {
		// Mapeamento de CEPs simulados para fins de demonstração
		const cepDatabase: Record<string, ZipCodeApiResponse> = {
			"01001000": {
				cep: "01001-000",
				logradouro: "Praça da Sé",
				complemento: "lado ímpar",
				bairro: "Sé",
				localidade: "São Paulo",
				uf: "SP",
				ibge: "3550308",
				gia: "1004",
				ddd: "11",
				siafi: "7107",
			},
			"70150900": {
				cep: "70150-900",
				logradouro: "Praça dos Três Poderes",
				complemento: "",
				bairro: "Zona Cívico-Administrativa",
				localidade: "Brasília",
				uf: "DF",
				ibge: "5300108",
				gia: "",
				ddd: "61",
				siafi: "9701",
			},
			"20031170": {
				cep: "20031-170",
				logradouro: "Avenida Rio Branco",
				complemento: "até 379 - lado ímpar",
				bairro: "Centro",
				localidade: "Rio de Janeiro",
				uf: "RJ",
				ibge: "3304557",
				gia: "",
				ddd: "21",
				siafi: "6001",
			},
			"40170110": {
				cep: "40170-110",
				logradouro: "Avenida Sete de Setembro",
				complemento: "de 1964/1965 a 2158/2159",
				bairro: "Vitória",
				localidade: "Salvador",
				uf: "BA",
				ibge: "2927408",
				gia: "",
				ddd: "71",
				siafi: "3849",
			},
		};

		// Simula o atraso de uma chamada de API real
		await new Promise((resolve) => setTimeout(resolve, 300));

		// Retorna os dados do CEP ou um erro
		const response = cepDatabase[zipCode];
		if (response) {
			return response;
		}

		return { erro: true } as ZipCodeApiResponse & { erro: boolean };
	}
}
