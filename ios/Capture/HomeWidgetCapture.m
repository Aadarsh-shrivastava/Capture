#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(HomeWidgetCapture, NSObject)

RCT_EXTERN_METHOD(peekPendingPrompts:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearPendingPrompts:(double)count
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setFocusTaskDisplay:(NSString *)timeline
                  mascot:(NSString *)mascot
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setCaptureNotification:(BOOL)enabled
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
