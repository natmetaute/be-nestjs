import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AuditSubscriber } from './audit/audit.subscriber';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'mtech',
      password: 'mtech6928',
      database: 'mtech',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // disable in production
    }),
    UsersModule,
    AuthModule,
    AuditModule,
    ConfigurationModule,
    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private readonly dataSource: DataSource) {
    new AuditSubscriber(this.dataSource);
  }
}
