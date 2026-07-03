import { Injectable, Inject } from '@nestjs/common';
import { WALLET_REPOSITORY, IWalletRepository } from './repositories/wallet.repository.interface';
import { WalletNotFoundException } from '../common/exceptions/business.exceptions';

@Injectable()
export class WalletService {
  constructor(
    @Inject(WALLET_REPOSITORY) private readonly walletRepository: IWalletRepository,
  ) {}

  async getBalanceByUserId(userId: string) {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new WalletNotFoundException();
    }

    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: wallet.balance.toString(),
    };
  }

  async getWalletByUserId(userId: string) {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new WalletNotFoundException();
    }
    return wallet;
  }
}
