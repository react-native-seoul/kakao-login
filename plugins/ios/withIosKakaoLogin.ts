/* eslint-disable no-console */
import {
  ConfigPlugin,
  WarningAggregator,
  withAppDelegate,
  withInfoPlist,
  withXcodeProject,
} from '@expo/config-plugins';
import {KakaoLoginPluginProps} from '..';
import {readFile, writeFile} from 'node:fs';

const KAKAO_SCHEMES = ['kakaokompassauth', 'storykompassauth', 'kakaolink'];

const KAKAO_HEADER_IMPORT_STRING = '#import <RNKakaoLogins.h>';

const KAKAO_LINKING_STRING = `if([RNKakaoLogins isKakaoTalkLoginUrl:url]) {
  return [RNKakaoLogins handleOpenUrl: url];
}`;

const KAKAO_SDK_VERSION_STRING = '$KakaoSDKVersion';

const KAKAO_SDK_VERSION_REGEX = /\$KakaoSDKVersion\=.*(\r\n|\r|\n)/g;

const readFileAsync = async (path: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    readFile(path, 'utf8', (err: any, data: string) => {
      if (err || !data) {
        console.error("Couldn't read file:" + path);
        reject(err);

        return;
      }

      resolve(data);
    });
  });
};

const writeFileAsync = async (path: string, data: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    writeFile(path, data, (err: any) => {
      if (err) {
        console.error("Couldn't write file:" + path);
        reject(err);

        return;
      }

      resolve();
    });
  });
};

const modifyInfoPlist: ConfigPlugin<KakaoLoginPluginProps> = (
  config,
  props,
) => {
  return withInfoPlist(config, async (config) => {
    if (!config.modResults.KAKAO_APP_KEY) {
      config.modResults.KAKAO_APP_KEY = props.kakaoAppKey;
    }

    const NEW_URL_TYPES = `kakao${props.kakaoAppKey}`;

    if (!Array.isArray(config.modResults.CFBundleURLTypes)) {
      config.modResults.CFBundleURLTypes = [];
    }

    const urlType = config.modResults.CFBundleURLTypes.find((item) =>
      item.CFBundleURLSchemes.includes(NEW_URL_TYPES),
    );

    if (!urlType) {
      config.modResults.CFBundleURLTypes.push({
        CFBundleURLSchemes: [NEW_URL_TYPES],
      });
    }

    if (!Array.isArray(config.modResults.LSApplicationQueriesSchemes)) {
      config.modResults.LSApplicationQueriesSchemes = KAKAO_SCHEMES;
    } else {
      KAKAO_SCHEMES.forEach(
        (scheme) =>
          !config.modResults.LSApplicationQueriesSchemes?.includes(scheme) &&
          config.modResults.LSApplicationQueriesSchemes?.push(scheme),
      );
    }

    return config;
  });
};

const modifyAppDelegate: ConfigPlugin = (config) => {
  const modifyContents = (contents: string): string => {
    if (!contents.includes(KAKAO_HEADER_IMPORT_STRING)) {
      contents = contents.replace(
        "@implementation AppDelegate",
        `${KAKAO_HEADER_IMPORT_STRING}

@implementation AppDelegate`
      );
    }

    if (!contents.includes(KAKAO_LINKING_STRING)) {
      contents = contents.replace(
        'options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {',
        `options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
      ${KAKAO_LINKING_STRING}`,
      );
    }

    return contents;
  };

  return withAppDelegate(config, (props) => {
    if (['objc', 'objcpp'].includes(props.modResults.language)) {
      props.modResults.contents = modifyContents(props.modResults.contents);
    } else {
      WarningAggregator.addWarningIOS(
        'withFacebook',
        'Swift AppDelegate files are not supported yet.',
      );
    }

    return props;
  });
};

const modifyPodfile: ConfigPlugin<KakaoLoginPluginProps> = (config, props) => {
  config = withXcodeProject(config, async (_props) => {
    const iosPath = _props.modRequest.platformProjectRoot;
    const podfile = await readFileAsync(`${iosPath}/Podfile`);

    const removedPodfile = podfile.replace(KAKAO_SDK_VERSION_REGEX, '');

    if (props.overrideKakaoSDKVersion) {
      const newPodfile = removedPodfile.concat(
        `${KAKAO_SDK_VERSION_STRING}="${props.overrideKakaoSDKVersion!}"\n`,
      );
      await writeFileAsync(`${iosPath}/Podfile`, newPodfile);
    } else {
      await writeFileAsync(`${iosPath}/Podfile`, removedPodfile);
    }

    return _props;
  });

  return config;
};

export const withIosKakaoLogin: ConfigPlugin<KakaoLoginPluginProps> = (
  config,
  props,
) => {
  config = modifyInfoPlist(config, props);
  config = modifyAppDelegate(config);
  config = modifyPodfile(config, props);

  return config;
};
