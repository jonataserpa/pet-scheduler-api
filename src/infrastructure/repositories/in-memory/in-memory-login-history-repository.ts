import { LoginHistory } from "../../../domain/entities/login-history.js";
import {
	LoginHistoryFilter,
	LoginHistoryRepository,
} from "../../../domain/repositories/login-history-repository.js";

export class InMemoryLoginHistoryRepository implements LoginHistoryRepository {
	private readonly loginHistories: LoginHistory[] = [];

	async save(loginHistory: LoginHistory): Promise<void> {
		const existingIndex = this.loginHistories.findIndex((item) => item.id === loginHistory.id);

		if (existingIndex >= 0) {
			this.loginHistories[existingIndex] = loginHistory;
		} else {
			this.loginHistories.push(loginHistory);
		}
	}

	async findAll(
		filter: LoginHistoryFilter,
		limit?: number,
		offset?: number,
	): Promise<LoginHistory[]> {
		let result = this.loginHistories.filter((history) => {
			if (filter.email && history.email !== filter.email) return false;
			if (filter.userId && history.userId !== filter.userId) return false;
			if (filter.status && history.status !== filter.status) return false;
			if (filter.ipAddress && history.ipAddress !== filter.ipAddress) return false;

			if (filter.startDate && history.timestamp < filter.startDate) return false;
			if (filter.endDate && history.timestamp > filter.endDate) return false;

			return true;
		});

		// Ordenar por timestamp decrescente (mais recente primeiro)
		result = result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

		// Aplicar paginação
		if (offset !== undefined && offset > 0) {
			result = result.slice(offset);
		}

		if (limit !== undefined && limit > 0) {
			result = result.slice(0, limit);
		}

		return result;
	}

	async findById(id: string): Promise<LoginHistory | null> {
		const found = this.loginHistories.find((history) => history.id === id);
		return found || null;
	}

	async findRecentByEmail(email: string, limit: number): Promise<LoginHistory[]> {
		return this.findAll({ email }, limit);
	}

	async findRecentByUserId(userId: string, limit: number): Promise<LoginHistory[]> {
		return this.findAll({ userId }, limit);
	}

	async countFailedAttempts(email: string, timeWindowMinutes: number): Promise<number> {
		const windowStartTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

		return this.loginHistories.filter(
			(history) =>
				history.email === email &&
				history.status === "failed" &&
				history.timestamp >= windowStartTime,
		).length;
	}

	async isSuspiciousIpActivity(
		ipAddress: string,
		timeWindowMinutes: number,
		threshold: number,
	): Promise<boolean> {
		const windowStartTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

		const failedAttemptsCount = this.loginHistories.filter(
			(history) =>
				history.ipAddress === ipAddress &&
				history.status === "failed" &&
				history.timestamp >= windowStartTime,
		).length;

		return failedAttemptsCount >= threshold;
	}
}
