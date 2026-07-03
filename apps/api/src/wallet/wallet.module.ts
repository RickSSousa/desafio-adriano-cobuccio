import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletRepository } from './repositories/wallet.repository';
import { WALLET_REPOSITORY } from './repositories/wallet.repository.interface';

@Module({
  controllers: [WalletController],
  providers: [
    WalletService,
    {
      provide: WALLET_REPOSITORY,
      useClass: WalletRepository,
    },
  ],
  exports: [WalletService, WALLET_REPOSITORY],
})
export class WalletModule {}
