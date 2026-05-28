import { useState } from 'react';
import { db } from '../services/firebaseConfig';
import { doc, updateDoc, arrayUnion, addDoc, collection, serverTimestamp, setDoc } from 'firebase/firestore';
import { Voucher, ClaimedVoucher, VoucherClaim } from '../types';
import { User } from 'firebase/auth';

interface UseVoucherClaimReturn {
    claimVoucher: (voucher: Voucher, merchantId: string, merchantUsername: string, user: User, contact?: string, userName?: string) => Promise<string | null>;
    loading: boolean;
    error: string | null;
    success: boolean;
}

export const useVoucherClaim = (): UseVoucherClaimReturn => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const claimVoucher = async (
        voucher: Voucher,
        merchantId: string,
        merchantUsername: string,
        user: User,
        contact: string = '',
        userName: string = ''
    ): Promise<string | null> => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // 1. Generate Unique Code
            const prefix = (merchantUsername || 'NEO').substring(0, 3).toUpperCase();
            const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
            const uniqueCode = `${prefix}-${suffix}`;

            // 2. Prepare User Wallet Object
            const walletVoucher: ClaimedVoucher = {
                ...voucher,
                uniqueCode,
                status: 'active',
                claimedAt: new Date().toISOString(),
                merchantId: merchantId,
                // Add description context if missing
                description: voucher.description || `Claimed from @${merchantUsername}`,
                usageType: voucher.usageType || 'single',
                redemptionCount: 0,
                ...(voucher.usageLimit !== undefined ? { usageLimit: voucher.usageLimit } : {})
            };

            // 3. Prepare Merchant Tracking Object
            const claimRecord: VoucherClaim = {
                voucherId: voucher.id,
                voucherTitle: voucher.title,
                code: uniqueCode,
                userId: user.uid,
                merchantId: merchantId,
                status: 'active',
                timestamp: serverTimestamp(),
                userContact: contact || user.email || 'Unknown',
                userName: userName || 'Guest',
                usageType: voucher.usageType || 'single',
                redemptionCount: 0,
                ...(voucher.usageLimit !== undefined ? { usageLimit: voucher.usageLimit } : {})
            };

            // 4. Execute Writes
            const userRef = doc(db, 'users', user.uid);

            // Try update first (optimistic that user doc exists)
            try {
                await updateDoc(userRef, {
                    savedVouchers: arrayUnion(walletVoucher),
                });
            } catch (err: any) {
                // If doc doesn't exist, create it (safe fallback)
                if (err.code === 'not-found') {
                    await setDoc(userRef, {
                        savedVouchers: arrayUnion(walletVoucher)
                    }, { merge: true });
                } else {
                    throw err;
                }
            }

            // Add to merchant tracking
            await addDoc(collection(db, 'voucher_claims'), claimRecord);

            setSuccess(true);
            return uniqueCode;
        } catch (err: any) {
            console.error("Claim Error:", err);
            if (err.code === 'permission-denied') {
                setError("Permission denied. You may need to sign in again.");
            } else {
                setError("Failed to claim voucher. Please try again.");
            }
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { claimVoucher, loading, error, success };
};
