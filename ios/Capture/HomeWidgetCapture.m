#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(HomeWidgetCapture, NSObject)

RCT_EXTERN_METHOD(getPendingPrompt:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearPendingPrompt:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
