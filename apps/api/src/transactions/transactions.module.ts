import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionRepository } from './repositories/transaction.repository';
import { TRANSACTION_REPOSITORY } from './repositories/transaction.repository.interface';
import { DepositStrategy } from './strategies/deposit.strategy';
import { TransferStrategy } from './strategies/transfer.strategy';
import { ReversalStrategy } from './strategies/reversal.strategy';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    DepositStrategy,
    TransferStrategy,
    ReversalStrategy,
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: TransactionRepository,
    },
  ],
  exports: [TransactionsService],
})
export class TransactionsModule {}
