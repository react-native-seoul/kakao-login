import {KaKaoLoginWebType, KakaoLoginModuleInterface} from './types';

const WebKakaoLogins: KakaoLoginModuleInterface = {
  login(props) {
    if (!props) {
      throw new Error('Web parameters are not provided');
    }

    const {restApiKeyWeb, redirectUrlWeb, codeWeb} = props as KaKaoLoginWebType;

    if (!restApiKeyWeb || !redirectUrlWeb || !codeWeb) {
      throw new Error('Web parameters are not provided');
    }

    const data: any = {
      grant_type: 'authorization_code',
      client_id: restApiKeyWeb,
      redirect_uri: redirectUrlWeb,
      code: codeWeb,
    };

    const queryString = Object.keys(data)
      .map(
        (k: any) => encodeURIComponent(k) + '=' + encodeURIComponent(data[k]),
      )
      .join('&');

    return fetch('https://kauth.kakao.com/oauth/token', {
      method: 'post',
      body: queryString,
      headers: {
        'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    }).then((res) => res.json());
  },
  logout(tokenWeb?: string) {
    return fetch('https://kapi.kakao.com/v1/user/logout', {
      method: 'post',
      headers: {Authorization: `Bearer ${tokenWeb}`},
    }).then((res) => res.json());
  },
  unlink(tokenWeb?: string) {
    return fetch('https://kapi.kakao.com/v1/user/unlink', {
      method: 'post',
      headers: {Authorization: `Bearer ${tokenWeb}`},
    }).then((res) => res.json());
  },
  getProfile(tokenWeb?: string) {
    return fetch('https://kapi.kakao.com/v2/user/me', {
      method: 'get',
      headers: {
        Authorization: `Bearer ${tokenWeb}`,
        'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    }).then((res) => res.json());
  },
  shippingAddresses(tokenWeb?: string) {
    return fetch('https://kapi.kakao.com/v2/user/shipping_address', {
      method: 'get',
      headers: {
        Authorization: `Bearer ${tokenWeb}`,
        'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    }).then((res) => res.json());
  },
  serviceTerms(tokenWeb?: string) {
    return fetch('https://kapi.kakao.com/v2/user/service_terms', {
      method: 'get',
      headers: {
        Authorization: `Bearer ${tokenWeb}`,
        'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    }).then((res) => res.json());
  },
  async getAccessToken() {
    throw new Error('Web does not support `getAccessToken`');
  },
  async loginWithKakaoAccount() {
    throw new Error('Web does not support `loginWithKakaoAccount`');
  },
};

export const login = WebKakaoLogins.login;
export const loginWithKakaoAccount = WebKakaoLogins.loginWithKakaoAccount;
export const logout = WebKakaoLogins.logout;
export const unlink = WebKakaoLogins.unlink;
export const getProfile = WebKakaoLogins.getProfile;
export const getAccessToken = WebKakaoLogins.getAccessToken;
export const shippingAddresses = WebKakaoLogins.shippingAddresses;
export const serviceTerms = WebKakaoLogins.serviceTerms;

export * from './types';
