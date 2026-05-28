# Project Functions List

## src\App.tsx
- LoadingFallback
- App
- AppContent
- handleRouteChange

## src\components\BetaMessageModal.tsx
- BetaMessageModal

## src\components\BrandedLoader.tsx
- BrandedLoader

## src\components\CategorySelector.tsx
- getCategories

## src\components\GlobeMap.tsx
- fetchProfiles

## src\components\layouts\BusinessLayout.tsx
- handleClaim
- handleQuickAuth
- executeClaim
- handleListClaim
- handleFeedbackSubmit

## src\components\layouts\LumiaTilesLayout.tsx
- getTileColor

## src\components\layouts\ModernGradientLayout.tsx
- handleFeedbackSubmit

## src\components\layouts\ThemedProfileLayout.tsx
- renderLayout

## src\components\LinkRenderer.tsx
- getIcon
- getEmoji

## src\components\OnboardingTour.tsx
- handleNext
- handleFinish

## src\components\ProfileSkeleton.tsx
- LoadingText

## src\components\RedeemedVoucherCard.tsx
- RedeemedVoucherCard
- handleDownload
- handleShare

## src\components\SaveContactButton.tsx
- saveContact

## src\components\ThemeSelector.tsx
- handleThemeSelect

## src\components\WhatsAppButton.tsx
- WhatsAppButton

## src\constants\countryCodes.ts
- getCountryByCode
- searchCountries

## src\contexts\ConnectionsContext.tsx
- addConnection
- updateConnection
- deleteConnection
- useConnections

## src\contexts\ThemeContext.tsx
- loadGoogleFont
- applyTheme
- handleSetTheme
- updateCustomSettings

## src\features\admin\AdminPortal.tsx
- AdminPortal
- handleLogin
- fetchData
- togglePublic
- handlePasswordReset
- handleResetLink
- handleDeleteUser
- handleDeleteVoucher

## src\features\auth\AuthContainer.tsx
- checkIdentifier
- handleUnifiedAuth
- createProfileDocuments
- handleGoogleSignIn

## src\features\auth\AuthScreen.tsx
- AuthScreen
- Divider

## src\features\connections\ConnectButton.tsx
- handleConnect

## src\features\connections\MyConnectionsPage.tsx
- MyConnectionsPage
- ConnectionCard
- handleSaveNote

## src\features\connections\QuickConnectModal.tsx
- handleAuth

## src\features\dashboard\Dashboard.tsx
- Dashboard
- handleUpdateProfile
- handleToggleProfileMode
- renderModule
- getModuleTitle

## src\features\dashboard\ProfileEditor.tsx
- checkUsernameAvailability
- handleChange
- handleSubmit
- handleChangePassword

## src\features\dashboard\ThemeCustomizer.tsx
- handleUpdate

## src\features\nBlast\NBlastModule.tsx
- NBlastModule

## src\features\nBusiness\NBusinessModule.tsx
- checkAvailability
- fetchBusinesses
- handleCreateBusiness
- handleDeleteBusiness
- handleUpdateBusinessProfile

## src\features\nBusiness\NRedemptionModule.tsx
- fetchRecentRedemptions
- handleVerify
- handleRedeem

## src\features\nClaim\NClaimModule.tsx
- handleImageUpload
- handleAdd
- handleDelete

## src\features\nDeal\NDealModule.tsx
- handleImageUpload
- handleAdd
- handleDelete

## src\features\nDeal\VoucherScanner.tsx
- validateVoucher
- redeemVoucher
- handleManualSubmit
- resetScanner

## src\features\nGame\games\CatchGame.tsx
- gameLoop
- handleMouseMove
- handleTouchMove
- startGame

## src\features\nGame\games\FlappyBird.tsx
- startGame
- flap
- update
- draw
- endGame
- loop

## src\features\nGame\games\MemoryMatch.tsx
- handleCardClick

## src\features\nGame\games\SpinWheel.tsx
- handleContinue

## src\features\nGame\NGameModule.tsx
- handleGameComplete

## src\features\nMenu\MenuExcelManager.tsx
- generateId
- handleExportTemplate
- handleExportCurrentMenu
- handleFileSelect
- handleConfirmImport

## src\features\nMenu\MenuItemShareModal.tsx
- toggleItemSelection
- formatPrice
- downloadStory
- getLayoutBackground
- getTextColor
- getPriceColor
- renderStandardLayout
- renderHeroLayout
- renderPromoLayout
- renderSpotlightLayout
- renderOfferLayout
- renderComboLayout
- renderLayout

## src\features\nMenu\NMenuModule.tsx
- handleAddItem
- handleEditItem
- handleImageUpload
- handleDeleteItem
- toggleAvailability
- handleThemeChange
- handleExcelImport
- toggleTodaysOfferItem
- saveTodaysOffer
- handleOfferTitleChange
- handleOfferDiscountChange

## src\features\nProfile\BusinessFeaturesEditor.tsx
- handleAddGalleryItem
- handleFileUpload
- handleRemoveGalleryItem

## src\features\nProfile\CoverPhotoManager.tsx
- CoverPhotoManager
- handleFileChange
- handleSaveCrop

## src\features\nProfile\LinkManagement.tsx
- LinkManagement
- handleSaveLink
- detectIconType
- resetForm
- startEditing
- handleDeleteLink
- toggleDisplayStyle
- getIconForType

## src\features\nProfile\NFCWriter.tsx
- NFCWriter
- handleWriteToNFC

## src\features\nProfile\NProfileModule.tsx
- debouncedSave
- searchCompanies
- handleUpdateProfileLinks
- handleUpdatePhoto
- handleUpdateCover

## src\features\nProfile\ProfilePhotoManager.tsx
- ProfilePhotoManager
- handleFileChange
- handleSaveCrop
- handleGeminiEdit

## src\features\nProfile\ProfileSharingCard.tsx
- handleUpdatePhoto
- checkUsernameAvailability
- handleSaveUsername
- copyToClipboard

## src\features\nProfile\ShareAssetsModal.tsx
- downloadAsset

## src\features\nProfile\WifiSharing.tsx
- WifiSharing
- handleGenerate
- handleWriteNFC

## src\features\nReview\NReviewModule.tsx
- handleSaveGoogleLink
- handleAddQuestion
- updateQuestion
- deleteQuestion
- addOption
- handleSaveSurvey
- handleDeleteSurvey
- handleToggleSurvey
- handleEditSurvey
- resetSurveyEditor
- exportFeedbackCSV
- exportSurveyResponses
- handleCopyLink

## src\features\nsales\NSalesPortal.tsx
- handleLogin
- fetchQRCodes
- handleGenerateQRs
- handleDeleteQR
- handleAssignQR
- handleUnlinkQR
- qrUrl

## src\features\nShop\NShopModule.tsx
- handleAddItem
- handleEditItem
- handleImageUpload
- handleDeleteItem
- toggleAvailability

## src\features\nShop\ProductItemShareModal.tsx
- toggleItemSelection
- formatPrice
- downloadStory
- shareToSocial
- getLayoutBackground
- getTextColor
- getPriceColor
- renderStandardLayout
- renderHeroLayout
- renderPromoLayout
- renderComboLayout
- renderLayout

## src\features\nWallet\NWalletModule.tsx
- handleShare

## src\features\profile\GlassProfile.tsx
- toggleLang
- toggleMode
- saveContact
- shareProfile
- handleSurvey

## src\features\profile\PublicProfilePage.tsx
- PublicProfilePage

## src\hooks\useAuth.ts
- useAuth
- initAuth
- handleSignOut

## src\hooks\useMobileVerification.ts
- useMobileVerification

## src\hooks\useNotification.ts
- useNotification

## src\hooks\useProfile.ts
- useProfile
- fetchProfile
- handleUpdateProfileLinks
- handleUpdatePhoto

## src\hooks\useSaveThemeToFirebase.ts
- useSaveThemeToFirebase
- saveTheme

## src\LanguageContext.tsx
- LanguageProvider
- t
- useLanguage

## src\layouts\MainApplication.tsx
- MainApplication
- handleHardReset
- handleUpdateActiveProfile
- handleSignOutWithCleanup

## src\page_views\Home.tsx
- Home
- toggleLang
- navigateToApp

## src\page_views\OfferClaimView.tsx
- OfferSkeleton
- OfferClaimView
- fetchOffer
- handleSubmit

## src\page_views\PublicMenuView.tsx
- getCurrencySymbol
- checkMobile
- handleBubbleCategorySelect
- handleBackToCategories
- addToCart
- removeFromCart
- handlePlaceOrder
- renderTodaysOffer
- renderCardsLayout
- renderGridLayout
- renderListLayout
- renderMagazineLayout
- renderMenuItems

## src\page_views\PublicProductView.tsx
- getCurrencySymbol
- addToCart
- removeFromCart
- handleWhatsAppInquiry

## src\page_views\PublicProfileView.tsx
- PublicProfileView
- loadProfile
- loadFromFirebase
- applyTheme
- trackView

## src\page_views\PublicReviewView.tsx
- handleStarClick

## src\page_views\PublicSurveyView.tsx
- fetchSurveys
- handleAnswerChange
- handleSubmit
- renderQuestion

## src\page_views\QRRedirectPage.tsx
- fetchQR
- handleClaimQR
- handleLoginSuccess

## src\reportWebVitals.ts
- reportWebVitals

## src\serviceWorkerRegistration.ts
- register
- registerValidSW
- checkValidServiceWorker
- unregister

## src\utils\colorUtils.ts
- adjustColor
- generatePalette
- getContrastText

## src\utils\imageUtils.ts
- getCroppedImg
- fileToDataUrl
- compressImage

