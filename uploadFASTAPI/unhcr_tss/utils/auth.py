from unhcr_tss.config import settings
from requests import get
from fastapi import Cookie, Header
from typing import Union


def isUserLoggedIn(AuthSession: Union[str, None] = Cookie(default=None),
                   Authorization: Union[str, None] = Header(default=None)):
    # we should retrieve two authentication way
    # for azure users the Authorization: `Bearer ${token}`, header
    # for couchdb user the  Cookie: AuthSession=xxxx
    # prioritize cookie over headers
    cookies = {'AuthSession': AuthSession}
    headers = {}
    if AuthSession is None:
        headers = {'Authorization': Authorization}
    r = get(settings.AUTH_SERVER + "/_session",
            cookies=cookies,
            headers=headers)
    userCtx = r.json().get("userCtx")
    return userCtx.get("name") is not None
