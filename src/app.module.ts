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
import { CompanyModule } from './company/company.module';
import { DataSource } from 'typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

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
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public', 
    }),
    UsersModule,
    AuthModule,
    AuditModule,
    ConfigurationModule,
    TransactionsModule,
    CompanyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private readonly dataSource: DataSource) {
    new AuditSubscriber(this.dataSource);
  }
}
