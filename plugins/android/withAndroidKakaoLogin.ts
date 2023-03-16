import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
  withStringsXml,
  withGradleProperties,
  withProjectBuildGradle,
} from '@expo/config-plugins';
import {ManifestActivity} from '@expo/config-plugins/build/android/Manifest';
import {KakaoLoginPluginProps} from '..';

const ACTIVITY_NAME = 'com.kakao.sdk.auth.AuthCodeHandlerActivity';

const modifyAndroidManifest: ConfigPlugin<KakaoLoginPluginProps> = (
  config,
  props,
) => {
  return withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults,
    );

    const newPreviewActivity: ManifestActivity = {
      $: {
        'android:name': ACTIVITY_NAME,
        'android:exported': 'true',
      },
      'intent-filter': [
        {
          action: [
            {
              $: {
                'android:name': 'android.intent.action.VIEW',
              },
            },
          ],
          category: [
            {$: {'android:name': 'android.intent.category.DEFAULT'}},
            {$: {'android:name': 'android.intent.category.BROWSABLE'}},
          ],
          data: [
            {
              $: {
                'android:host': 'oauth',
                'android:scheme': `kakao${props.kakaoAppKey}`,
              },
            },
          ],
        },
      ],
    };

    if (!mainApplication.activity) {
      mainApplication.activity = [];
      mainApplication.activity.push(newPreviewActivity);

      return config;
    }

    const oldActivityIndex = mainApplication.activity.findIndex(
      (activity) => activity.$['android:name'] === ACTIVITY_NAME,
    );

    if (oldActivityIndex < 0) {
      mainApplication.activity.push(newPreviewActivity);
    } else {
      mainApplication.activity.splice(oldActivityIndex, 1, newPreviewActivity);
    }

    return config;
  });
};

const modifyAndroidStrings: ConfigPlugin<KakaoLoginPluginProps> = (
  config,
  props,
) => {
  return withStringsXml(config, (config) => {
    AndroidConfig.Strings.setStringItem(
      [{$: {name: 'kakao_app_key'}, _: props.kakaoAppKey}],
      config.modResults,
    );

    return config;
  });
};

const modifyProjectBuildGradle: ConfigPlugin<KakaoLoginPluginProps> = (
  config,
  props,
) => {
  config = withGradleProperties(config, (config) => {
    AndroidConfig.BuildProperties.updateAndroidBuildProperty(
      config.modResults,
      'android.kotlinVersion',
      props.kotlinVersion ?? '1.5.20',
    );

    return config;
  });

  config = withProjectBuildGradle(config, (config) => {
    if (
      !config.modResults.contents.includes(
        'org.jetbrains.kotlin:kotlin-gradle-plugin:',
      )
    ) {
      // config.modResults.contents = config.modResults.contents.replace(
      //   `buildToolsVersion = "29.0.3"`,
      //   `buildToolsVersion = "30.0.0"`
      // );
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies\s?{/,
        `dependencies {
          classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:${
            props.kotlinVersion ?? '1.5.20'
          }'`,
      );
    }

    return config;
  });

  if (props.overrideKakaoSDKVersion) {
    config = withProjectBuildGradle(config, (config) => {
      const regex = /project.ext {.*\n.*set\('react-native', \[\n.*\]\)\n.*\}/s;
      const match = regex.exec(config.modResults.contents)?.[0];
      let newMatch: string;

      if (match) {
        const kakaoSDKRegex = /kakao: \[\n.*\n.*\]/;
        const kakaoSDKMatch = kakaoSDKRegex.exec(match)?.[0];

        if (kakaoSDKMatch) {
          newMatch = match.replace(
            kakaoSDKRegex,
            `kakao: [
                sdk: "${props.overrideKakaoSDKVersion}",
            ]`,
          );

          config.modResults.contents = config.modResults.contents.replace(
            regex,
            newMatch,
          );
        } else {
          const endRegex = /\],\n *\]\)\n *}/s;
          const endMatch = endRegex.exec(match)?.[0];

          if (endMatch) {
            newMatch = match.replace(
              endRegex,
              `kakao: [
                sdk: "${props.overrideKakaoSDKVersion}",
            ],
        ],
    ])
}`,
            );

            config.modResults.contents = config.modResults.contents.replace(
              regex,
              newMatch,
            );
          }
        }

        return config;
      }

      config.modResults.contents = config.modResults.contents.concat(
        `
project.ext {
    set('react-native', [
        versions: [
            kakao: [
                sdk: "${props.overrideKakaoSDKVersion}",
            ],
        ],
    ])
}`,
      );

      return config;
    });
  }

  return config;
};

export const withAndroidKakaoLogin: ConfigPlugin<KakaoLoginPluginProps> = (
  config,
  props,
) => {
  config = modifyAndroidManifest(config, props);
  config = modifyAndroidStrings(config, props);
  config = modifyProjectBuildGradle(config, props);

  return config;
};
