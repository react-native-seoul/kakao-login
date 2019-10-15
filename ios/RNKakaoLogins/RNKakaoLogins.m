#import "RNKakaoLogins.h"
#import <React/RCTLog.h>
#import <KakaoOpenSDK/KakaoOpenSDK.h>

@implementation RNKakaoLogins

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

NSObject* handleNullableString(NSString *_Nullable string)
{
    return string != nil ? string : [NSNull null];
}

NSObject* handleKOBoolean(KOOptionalBoolean boolean)
{
    switch(boolean){
        case KOOptionalBooleanTrue : return @(YES);
        case KOOptionalBooleanFalse: return @(NO);
        case KOOptionalBooleanNull : return [NSNull null];
    }
}

NSString* getErrorCode(NSError *error){
    int errorCode = (int)error.code;
    
    switch(errorCode){
        case 1:
            return @"E_UNKNOWN";
        case 2:
            return @"E_CANCELLED_OPERATION";
        case 3:
            return @"E_IN_PROGRESS_OPERATION";
        case 4:
            return @"E_TOKEN_NOT_FOUND";
        case 5:
            return @"E_DEACTIVATED_SESSION";
        case 6:
            return @"E_ALREADY_LOGINED";
        case 9:
            return @"E_HTTP_ERROR";
        case 7:
            return @"E_BAD_RESPONSE";
        case 8:
            return @"E_NETWORK_ERROR";
        case 10:
            return @"E_NOT_SUPPORTED";
        case 11:
            return @"E_BAD_PARAMETER";
        case 14:
            return @"E_ILLEGAL_STATE";
            
        default:
            return @(error.code).stringValue;
    }
}

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(login:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    KOSession *session = [KOSession sharedSession];
    [session close]; // ensure old session was closed
    
    [session openWithCompletionHandler:^(NSError *error) {
        if ([session isOpen]) {
            resolve(@{@"token": session.token.accessToken});
        } else {
            RCTLogInfo(@"Error=%@", error);
            reject(getErrorCode(error), error.localizedDescription, error);
        }
    }];
}

RCT_EXPORT_METHOD(logout:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    KOSession *session = [KOSession sharedSession];
    
    [session logoutAndCloseWithCompletionHandler:^(BOOL success, NSError *error) {
        if(success){
            resolve(@"Logged Out");
        } else {
            RCTLogInfo(@"Error=%@", error);
            reject(getErrorCode(error), error.localizedDescription, error);
        }
    }];
}

RCT_EXPORT_METHOD(getProfile:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    [KOSessionTask userMeTaskWithCompletion:^(NSError *error, KOUserMe* me) {
        if (error) {
            RCTLogInfo(@"Error=%@", error);
            reject(getErrorCode(error), error.localizedDescription, error);
        } else {
            NSDictionary* profile = @{
                @"id": handleNullableString(me.ID),
                @"nickname": handleNullableString(me.account.profile.nickname),
                @"email": handleNullableString(me.account.email),
                @"display_id": handleNullableString(me.account.displayID),
                @"phone_number": handleNullableString(me.account.phoneNumber),
                @"profile_image_url": handleNullableString(me.account.profile.profileImageURL.absoluteString),
                @"thumb_image_url": handleNullableString(me.account.profile.thumbnailImageURL.absoluteString),
                @"is_email_verified": handleKOBoolean(me.account.isEmailVerified),
                @"is_kakaotalk_user": handleKOBoolean(me.account.isKakaotalkUser),
                @"has_signed_up": handleKOBoolean(me.hasSignedUp),
            };
            
            resolve(profile);
        }
    }];
}

@end
