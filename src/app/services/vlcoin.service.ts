import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VlcoinService {
  private vlcoinBalance = new BehaviorSubject<number>(0);
  public vlcoinBalance$ = this.vlcoinBalance.asObservable();
  
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {
    this.initVlcoinData();
  }

  private async initVlcoinData() {
    // Listen for user changes
    this.authService.user$.subscribe(async user => {
      if (user && user.id) {
        // Check if user has a vlcoin record
        await this.getVlcoinBalance(user.id);
      } else {
        // Reset balance if no user is logged in
        this.vlcoinBalance.next(0);
      }
    });
  }

  /**
   * Get the current VLCoin balance for a user
   * @param userId The user ID
   * @returns The current balance
   */
  async getVlcoinBalance(userId: string): Promise<number> {
    try {
      // First try to get record from the vlcoin table
      const { data, error } = await this.supabaseService.getClient()
        .from('vlcoin')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // If no record found, create one with zero balance
          await this.createVlcoinRecord(userId);
          // Important: Update the BehaviorSubject
          this.vlcoinBalance.next(0);
          return 0;
        }
        throw error;
      }

      const balance = data?.balance || 0;
      // Make sure to update the BehaviorSubject
      this.vlcoinBalance.next(balance);
      console.log('Updated VLCoin balance:', balance);
      return balance;
    } catch (error) {
      console.error('Error getting VLCoin balance:', error);
      // Fallback to profile vlcoin_balance if there's an issue
      try {
        const { data: profile } = await this.supabaseService.getClient()
          .from('profiles')
          .select('vlcoin_balance')
          .eq('id', userId)
          .single();
          
        const fallbackBalance = profile?.vlcoin_balance || 0;
        // Important: Update the BehaviorSubject with fallback value
        this.vlcoinBalance.next(fallbackBalance);
        console.log('Using fallback VLCoin balance:', fallbackBalance);
        return fallbackBalance;
      } catch (fallbackError) {
        console.error('Error getting fallback VLCoin balance:', fallbackError);
        // If all else fails, reset to 0
        this.vlcoinBalance.next(0);
        return 0;
      }
    }
  }

  /**
   * Create a new VLCoin record for a user
   * @param userId The user ID
   * @returns Whether the operation was successful
   */
  private async createVlcoinRecord(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseService.getClient()
        .from('vlcoin')
        .insert({
          user_id: userId,
          balance: 0
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating VLCoin record:', error);
      return false;
    }
  }

  /**
   * Update a user's VLCoin balance
   * @param userId The user ID
   * @param amount The new balance amount
   * @returns Whether the operation was successful
   */
  async updateVlcoinBalance(userId: string, amount: number): Promise<boolean> {
    try {
      // Update in the vlcoin table
      const { error } = await this.supabaseService.getClient()
        .from('vlcoin')
        .update({ balance: amount })
        .eq('user_id', userId);

      if (error) throw error;
      
      // Also update in the profiles table for backward compatibility
      await this.supabaseService.getClient()
        .from('profiles')
        .update({ vlcoin_balance: amount })
        .eq('id', userId);
        
      // Update the local subject with the new balance
      this.vlcoinBalance.next(amount);
      return true;
    } catch (error) {
      console.error('Error updating VLCoin balance:', error);
      return false;
    }
  }

  /**
   * Add VLCoins to a user's balance
   * @param userId The user ID
   * @param amount The amount to add
   * @returns Whether the operation was successful
   */
  async addVlcoins(userId: string, amount: number): Promise<boolean> {
    try {
      // First get the current balance to ensure we have the latest value
      const currentBalance = await this.getVlcoinBalance(userId);
      const newBalance = currentBalance + amount;
      
      // Update with the new balance and ensure UI is updated
      const success = await this.updateVlcoinBalance(userId, newBalance);
      
      // Make sure the behavior subject is updated
      if (success) {
        this.vlcoinBalance.next(newBalance);
      }
      
      return success;
    } catch (error) {
      console.error('Error adding VLCoins:', error);
      return false;
    }
  }

  /**
   * Subtract VLCoins from a user's balance
   * @param userId The user ID
   * @param amount The amount to subtract
   * @returns Whether the operation was successful
   */
  async subtractVlcoins(userId: string, amount: number): Promise<boolean> {
    try {
      // First get the current balance to ensure we have the latest value
      const currentBalance = await this.getVlcoinBalance(userId);
      if (currentBalance < amount) {
        console.error('Insufficient VLCoins');
        return false;
      }
      
      const newBalance = currentBalance - amount;
      
      // Update with the new balance and ensure UI is updated
      const success = await this.updateVlcoinBalance(userId, newBalance);
      
      // Make sure the behavior subject is updated
      if (success) {
        this.vlcoinBalance.next(newBalance);
      }
      
      return success;
    } catch (error) {
      console.error('Error subtracting VLCoins:', error);
      return false;
    }
  }
} 