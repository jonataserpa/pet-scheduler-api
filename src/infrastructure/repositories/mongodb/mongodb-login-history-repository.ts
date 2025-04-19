import { Collection, Db, Document } from 'mongodb';
import { LoginHistory } from '../../../domain/entities/login-history.js';
import { LoginHistoryFilter, LoginHistoryRepository } from '../../../domain/repositories/login-history-repository.js';

export class MongoDBLoginHistoryRepository implements LoginHistoryRepository {
  private collection: Collection<Document>;

  constructor(private readonly db: Db) {
    this.collection = this.db.collection('login_histories');
    this.setupIndexes().catch(console.error);
  }

  private async setupIndexes(): Promise<void> {
    // Índice para melhorar performance de consultas por email
    await this.collection.createIndex({ email: 1 });
    
    // Índice para melhorar performance de consultas por userId
    await this.collection.createIndex({ userId: 1 });
    
    // Índice por timestamp para consultas baseadas em data
    await this.collection.createIndex({ timestamp: -1 });
    
    // Índice composto para consultas de tentativas falhas por email
    await this.collection.createIndex({ email: 1, status: 1, timestamp: -1 });
    
    // Índice composto para consultas de atividades suspeitas por IP
    await this.collection.createIndex({ ipAddress: 1, status: 1, timestamp: -1 });
  }

  private toDocument(loginHistory: LoginHistory): Document {
    return {
      _id: loginHistory.id,
      userId: loginHistory.userId,
      email: loginHistory.email,
      status: loginHistory.status,
      timestamp: loginHistory.timestamp,
      ipAddress: loginHistory.ipAddress,
      userAgent: loginHistory.userAgent,
      geoLocation: loginHistory.geoLocation,
      authMethod: loginHistory.authMethod,
      details: loginHistory.details
    };
  }

  private toEntity(document: Document): LoginHistory {
    return new LoginHistory(
      document._id.toString(),
      document.userId,
      document.email,
      document.status,
      new Date(document.timestamp),
      document.ipAddress,
      document.userAgent,
      document.geoLocation,
      document.authMethod,
      document.details
    );
  }

  async save(loginHistory: LoginHistory): Promise<void> {
    const document = this.toDocument(loginHistory);
    
    await this.collection.updateOne(
      { _id: document._id },
      { $set: document },
      { upsert: true }
    );
  }

  async findAll(
    filter: LoginHistoryFilter,
    limit?: number,
    offset?: number
  ): Promise<LoginHistory[]> {
    const query: Document = {};
    
    if (filter.email) query.email = filter.email;
    if (filter.userId) query.userId = filter.userId;
    if (filter.status) query.status = filter.status;
    if (filter.ipAddress) query.ipAddress = filter.ipAddress;
    
    if (filter.startDate || filter.endDate) {
      query.timestamp = {};
      if (filter.startDate) query.timestamp.$gte = filter.startDate;
      if (filter.endDate) query.timestamp.$lte = filter.endDate;
    }
    
    const options: Document = {
      sort: { timestamp: -1 }
    };
    
    if (limit) options.limit = limit;
    if (offset) options.skip = offset;
    
    const documents = await this.collection.find(query, options).toArray();
    return documents.map((doc) => this.toEntity(doc));
  }

  async findById(id: string): Promise<LoginHistory | null> {
    const document = await this.collection.findOne({ _id: id });
    return document ? this.toEntity(document) : null;
  }

  async findRecentByEmail(email: string, limit: number): Promise<LoginHistory[]> {
    const documents = await this.collection
      .find({ email })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    return documents.map((doc) => this.toEntity(doc));
  }

  async findRecentByUserId(userId: string, limit: number): Promise<LoginHistory[]> {
    const documents = await this.collection
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    return documents.map((doc) => this.toEntity(doc));
  }

  async countFailedAttempts(email: string, timeWindowMinutes: number): Promise<number> {
    const windowStartTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    
    return this.collection.countDocuments({
      email,
      status: 'failed',
      timestamp: { $gte: windowStartTime }
    });
  }

  async isSuspiciousIpActivity(
    ipAddress: string,
    timeWindowMinutes: number,
    threshold: number
  ): Promise<boolean> {
    const windowStartTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    
    const count = await this.collection.countDocuments({
      ipAddress,
      status: 'failed',
      timestamp: { $gte: windowStartTime }
    });
    
    return count >= threshold;
  }
} 