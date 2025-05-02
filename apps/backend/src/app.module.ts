import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { LoggerModule, LoggerModuleOptions } from '@monorepo-starter/logger';
import { ConfigService } from './config/config.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { GraphQLModule } from '@nestjs/graphql';
import type { ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloDriver } from '@nestjs/apollo';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): LoggerModuleOptions => ({
        global: true,
        ...configService.getLoggerFactoryConfig(),
      }),
      inject: [ConfigService],
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        autoSchemaFile: true,
        ...configService.getGraphql(),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
  ],
})
export class AppModule {}
