import { UserThemeSettings } from './types/theme';

// Multi-Profile System Types
export interface UserAccount {
    profileId: string;
    profileType: 'personal' | 'business' | 'ngo';
    isPrimary: boolean;
    createdAt: any; // Firestore Timestamp
}

// Connection/Contact Management
export interface UserConnection {
    id?: string;
    profileId: string; // Connected profile ID
    profileName: string;
    profileType: 'personal' | 'business' | 'ngo';
    username?: string; // Target username for URL navigation
    category?: string; // Professional/Business category
    country?: string;
    city?: string;
    note?: string; // User's private note
    tags?: string[]; // e.g., ['client', 'supplier', 'partner']
    addedAt: any; // Firestore Timestamp
    lastContactedAt?: any; // Firestore Timestamp
}
export interface UserLink {
    id: string;
    title: string;
    titleAr?: string;
    url: string;
    type?: 'standard' | 'review' | 'menu' | 'whatsapp' | 'website' | 'location' | 'social' | 'tel' | 'mailto';
    iconType?: string; // Predefined icon names (e.g., 'instagram', 'facebook', 'star')
    isPrimary?: boolean; // If true, renders as a large grid button
    displayStyle?: 'main' | 'bubble'; // Where to display: main profile or floating bubble
}

export interface UserProfile {
    id?: string; // Firestore Document ID
    userId?: string; // Owner User ID (for multi-profile system)
    ownerId?: string; // Owner User ID (Preferred)
    username: string;
    displayName?: string;
    email: string;
    mobileNumber: string;
    links?: UserLink[];
    themeSettings?: UserThemeSettings;
    themeId?: string; // Legacy field, keeping for compat
    photoURL?: string;
    coverURL?: string; // Banner/Hero Image
    bio?: string;
    businessCategory?: string; // Legacy - use category instead
    category?: string; // NEW: Professional/Business category from constants
    companyId?: string; // ID of linked company
    savedContacts?: string[]; // Deprecated - use connections sub-collection
    vouchers?: Voucher[]; // Created vouchers
    savedVouchers?: ClaimedVoucher[]; // Wallet
    location?: string; // User-friendly location (e.g. "Dubai, UAE")
    // Visibility & Search Fields
    isPublic?: boolean;
    connectEnabled?: boolean; // Toggle connect button on public profile (default: true)
    saveContactEnabled?: boolean; // Toggle save contact button on public profile (default: true)
    tags?: string[]; // General search tags
    categories?: string[]; // Deprecated - use category field
    profileType?: 'personal' | 'business' | 'ngo' | 'personal_jobseeker' | 'society_club' | 'business_person' | 'staff'; // Main Profile Type

    // Multi-Profile Support
    accounts?: UserAccount[]; // List of all profiles this user owns
    activeProfileId?: string; // Currently active profile
    profileMode?: 'personal' | 'business'; // NEW: Current active mode for dual-profile users

    // Mode-Specific Overrides (If these exist, they override core fields based on profileMode)
    personalData?: {
        displayName?: string;
        bio?: string;
        photoURL?: string;
        links?: UserLink[];
    };
    businessData?: {
        displayName?: string;
        bio?: string;
        photoURL?: string;
        links?: UserLink[];
    };

    welcomeMessage?: string; // NEW: Custom greeting for public profile
    website?: string; // Business Website URL
    country?: string;
    countryCode?: string; // e.g. "+971"
    city?: string;
    coordinates?: { lat: number, lng: number }; // Precise location for map discovery

    // NGO & Health Details
    ngoDetails?: {
        bloodDonationCount: number;
        lastDonated?: string;
        organizationType?: string;
    };

    // Profile Interlinking (Work Experience / Affiliations)
    worksAt?: {
        companyId: string;      // nProfile ID of company
        companyName: string;    // Display name
        companyLogo?: string;   // Logo URL
        companyUsername: string; // For profile link
        role?: string;          // e.g. "Manager"
    };
    worksAtDisplay?: 'inline' | 'floating' | 'disabled'; // Default: inline
    designation?: string; // Current Job Title
    workExperience?: {
        companyId: string;
        companyName: string;
        role: string;
        status: 'pending' | 'verified' | 'active';
        logoUrl?: string; // Company Logo
        username?: string;
        photoURL?: string;
        country?: string; // Country of the company
        isCurrent?: boolean; // Currently working here?
        startDate?: string; // ISO date or "YYYY-MM"
        endDate?: string; // ISO date or "YYYY-MM"
    }[];

    // Extended Contact Info
    websites?: {
        url: string;
        label: string; // e.g. "Portfolio", "Company"
    }[];
    additionalPhones?: {
        number: string;
        label: string; // e.g. "Work", "Personal"
        countryCode: string;
    }[];
    linkedProfiles?: {
        profileId: string;
        name: string;
        relation: string; // e.g. "Spouse", "Partner", "Child"
        avatarUrl?: string;
    }[];

    // Advanced Business Features
    subtitle?: string; // e.g. "Advanced Medical Imaging Solutions"
    googleReviewUrl?: string; // Link for "Rate Our Service"
    feedbackEnabled?: boolean; // Toggle "How did you hear about us?"
    feedbackRewardEnabled?: boolean; // Toggle "Offer Reward for Feedback"
    feedbackRewardVoucherId?: string; // ID of the specific voucher to offer
    gameEnabled?: boolean; // Toggle nGame branded games
    leadCaptureEnabled?: boolean; // NEW: Toggle Lead Capture form
    appointmentsEnabled?: boolean; // NEW: Toggle Appointment Booking form
    // nElite Membership
    nElite?: boolean; // True if this profile is an nElite member
    nEliteRedirectEnabled?: boolean; // If true, visiting the profile instantly redirects to ncard.neoays.com/{username}
    testimonialsEnabled?: boolean; // NEW: Toggle Endorsements/Testimonials form
    portfolioEnabled?: boolean; // NEW: Toggle Digital Portfolio/Catalog
    introVideoUrl?: string; // NEW: URL for welcome video/audio
    introVideoEnabled?: boolean; // NEW: Toggle Welcome bubble
    menuEnabled?: boolean; // Toggle Digital Menu
    productsEnabled?: boolean; // Toggle Product Catalog
    pdfUrl?: string; // Hosted PDF Link
    gallery?: {
        id: string;
        type: 'image' | 'video';
        url: string; // Image URL or YouTube Link
        thumbnail?: string;
    }[];
    customActions?: {
        label: string;
        actionType: 'call' | 'save_contact' | 'link';
        value: string;
    }[];
    // Menu & Ordering
    menuTheme?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'violet' | 'slate' | 'orange' | 'cyan'; // Menu color theme
    menuCurrency?: string; // Currency symbol for menu prices (e.g., 'OMR', 'AED', 'SAR')
    todaysOffer?: {
        enabled: boolean;
        title?: string;
        titleAr?: string;
        itemIds: string[]; // Selected menu item IDs for today's offer
        discount?: string; // e.g. "20% OFF" or "Buy 1 Get 1"
        expiresAt?: string; // ISO date
    };
    menuItems?: MenuItem[];
    productItems?: MenuItem[];
    activeOrders?: Order[];
    // Gamification
    gameStats?: {
        highScore: number;
        lastPlayed: any;
    };
    // Review & Survey
    googleMapsReviewLink?: string; // Google Maps location URL for reviews (replaces googleReviewUrl)
    reviewEnabled?: boolean; // Toggle Google review feature
    surveyEnabled?: boolean; // Toggle survey feature
    partnerBusinessIds?: string[]; // Up to 3 partner businesses for voucher rewards
    createdAt?: any; // Firestore Timestamp
}

export interface Feedback {
    id: string;
    userId: string; // Business Owner ID
    source: string; // e.g. "Google Maps", "Instagram"
    rating?: number;
    comment?: string;
    timestamp: any;
    customerContact?: string; // For claiming reward
}

export interface Voucher {
    id: string;
    title: string;
    description?: string;
    value: string; // e.g. "50% OFF"
    code?: string;
    expiryDate?: string;
    imageUrl?: string; // Optional image URL or Base64
    isPublic?: boolean; // Show on Home Page Public Feed
    termsAndConditions?: string; // T&C for the voucher
    usageType?: 'single' | 'multiple' | 'limited';
    usageLimit?: number; // If limited, how many times
    redeemedCount?: number; // Global redemption count
}

export interface UserStats {
    totalViews: number;
    clicks?: number;
}

export interface ClaimedVoucher extends Voucher {
    uniqueCode: string; // The specific generated code e.g. "JOH-8X2A"
    status: 'active' | 'redeemed' | 'expired' | 'cancelled';
    claimedAt: any;
    usedAt?: any; // Last used time
    merchantId: string; // ID of the business who issued it
    redemptionCount?: number; // How many times THIS user used it
}

export interface VoucherClaim {
    id?: string;
    voucherId: string;
    code: string;
    userId: string; // User who claimed it
    merchantId: string;
    status: 'active' | 'used' | 'redeemed' | 'expired' | 'cancelled';
    timestamp: any; // Firestore Timestamp
    userContact: string; // Mobile or Email
    usedAt?: string; // ISO String
    redemptionCount?: number;
    usageType?: 'single' | 'multiple' | 'limited';
    usageLimit?: number;
    redeemedBy?: string; // Business ID who redeemed it
    redeemedByName?: string; // Name of business who redeemed it
    userName?: string; // Customer's name captured at claim
    voucherTitle?: string; // Snapshot of voucher title
}

export interface MenuItem {
    id: string;
    name: string;
    nameAr?: string;
    description?: string;
    descriptionAr?: string;
    price: string;
    oldPrice?: string; // For promotions - shows strikethrough
    category: string;
    categoryAr?: string;
    imageUrl?: string;
    isAvailable: boolean;
}

export interface Order {
    id: string;
    items: {
        itemId: string;
        name: string;
        quantity: number;
        price: string;
    }[];
    totalPrice: string;
    status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
    customerContact: string; // Mobile link
    timestamp: any;
}

export interface GameScore {
    id?: string;
    username: string;
    displayName: string;
    score: number;
    merchantId?: string;
    merchantUsername?: string;
    timestamp: any;
    location?: string; // For area-wise sorting
}

// ============ Survey & Feedback Types ============

export interface SurveyQuestion {
    id: string;
    text: string;
    textAr?: string;
    type: 'multiple-choice' | 'rating' | 'text' | 'short-text';
    options?: { id: string; text: string; textAr?: string }[];
    required: boolean;
    order: number;
}

export interface Survey {
    id: string;
    businessId: string;
    ownerId?: string; // Owner User ID
    title: string;
    titleAr?: string;
    description?: string;
    descriptionAr?: string;
    questions: SurveyQuestion[];
    isActive: boolean;
    rewardEnabled: boolean;
    rewardVoucherId?: string; // Voucher to give on completion
    rewardVoucherBusinessId?: string; // Business ID of the voucher (if different from survey owner)
    createdAt: any;
    updatedAt?: any;
}

export interface SurveyResponse {
    id: string;
    surveyId: string;
    businessId: string;
    ownerId?: string; // Owner User ID
    answers: { questionId: string; value: string | string[] }[];
    respondentContact?: string; // Optional for anonymous
    voucherClaimed: boolean;
    claimedVoucherId?: string;
    rewardVoucherBusinessId?: string; // Business ID of the voucher (if different from survey owner)
    claimedFromBusinessId?: string; // Which partner business voucher was claimed from
    submittedAt: any;
}
