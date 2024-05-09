import { apiCall } from '@/graphql/client';
import { Button, Checkbox, Input, Label } from '@/components';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export const LoginScreen = () => {
  const { t } = useTranslation('common');
  const [image, setImage] = useState<{
    src: string;
    author: string;
    imageLocation: string;
    imageCreatorUrl: string;
    imageUnsplashUrl: string;
  } | null>(null);
  useEffect(() => {
    fetch('https://login-image.vendure.io')
      .then((res) => res.json())
      .then((data) => {
        const image = {
          src: data.urls.regular,
          author: data.user.name,
          imageLocation: data.location.name,
          imageCreatorUrl: data.user.links.html,
          imageUnsplashUrl: data.links.html,
        };
        setImage(image);
      });
  }, []);

  const login = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const username = (e.currentTarget.elements.namedItem('username') as HTMLInputElement).value;
    const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
    const rememberMe = (e.currentTarget.elements.namedItem('rememberMe') as HTMLInputElement).checked;
    const data = await apiCall('mutation')({
      login: [
        { username, password, rememberMe },
        {
          __typename: true,
          '...on CurrentUser': { id: true },
          '...on InvalidCredentialsError': { message: true },
          '...on NativeAuthStrategyError': { message: true },
        },
      ],
    });
    if (data.login.__typename !== 'CurrentUser') toast(data.login.message, {});
  };
  return (
    <div className="flex h-[100vh] w-[100vw] bg-background text-foreground">
      <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
        <div className="flex items-center justify-center py-12">
          <div className="mx-auto grid w-[350px] gap-6">
            <h1 className="select-none text-3xl font-bold">{t('logVendure')}</h1>
            <form onSubmit={login} className="grid gap-4">
              <div className="grid gap-2">
                <Label className="select-none" htmlFor="email">
                  {t('userName')}
                </Label>
                <Input placeholder={t('userName')} name="username" />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label className="select-none" htmlFor="password">
                    {t('password')}
                  </Label>
                </div>
                <Input placeholder={t('password')} type="password" name="password" />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="rememberMe" name="rememberMe" />
                <label
                  htmlFor="rememberMe"
                  className="select-none text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t('rememberMe')}
                </label>
              </div>
              <Button type="submit">{t('login')}</Button>
            </form>
          </div>
        </div>
        <div className="relative hidden bg-muted lg:block">
          {image && (
            <img
              src={image.src}
              alt="Image"
              width="1920"
              height="1080"
              className="pointer-events-none h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          )}
          <div className="absolute bottom-0 right-0 bg-gradient-to-t from-black to-transparent p-6 dark:from-black/50 dark:to-transparent">
            <h1 className="mb-2 select-none text-3xl font-bold text-white">{t('welcome')}</h1>
            <p className="text-xs font-semibold text-white">
              {t('photoBy')}
              <a href={image?.imageCreatorUrl} className="text-blue-500 underline">
                {image?.author}
              </a>
            </p>
            <p className="text-xs text-white">
              {image?.imageLocation} on{' '}
              <a href={image?.imageUnsplashUrl} className="select-none text-blue-500 underline">
                {t('unsplash')}
              </a>
            </p>
            <div className="flex select-none items-center justify-end gap-2">
              <a href="https://aexol.com" target="_blank" rel="noreferrer">
                <p className="text-end text-xs text-white">{t('poweredBy')}</p>
                <svg width="40" height="40" viewBox="0 0 71 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_1401_144)">
                    <path
                      d="M0.906403 40.7746H3.25881C3.68652 40.7746 3.92176 40.5154 4.02869 40.2562L4.79856 38.5282H10.6154L11.3853 40.2346C11.5778 40.645 11.7488 40.7746 12.1338 40.7746H14.5076C14.8284 40.7746 14.9994 40.4938 14.8711 40.213L8.17747 25.6761C8.11331 25.5465 7.96362 25.4385 7.81392 25.4385H7.60006C7.45036 25.4385 7.30067 25.5465 7.23651 25.6761L0.542849 40.213C0.414536 40.4938 0.58562 40.7746 0.906403 40.7746ZM6.08169 35.5906L7.6856 32.0265H7.70699L9.33229 35.5906H6.08169Z"
                      fill="white"
                    ></path>
                    <path
                      d="M17.2405 40.3642C17.2405 40.5802 17.4116 40.7746 17.6469 40.7746H26.5004C26.7357 40.7746 26.9068 40.5802 26.9068 40.3642V38.0098C26.9068 37.7938 26.7357 37.5994 26.5004 37.5994H20.5767L20.5767 34.6834H25.4526C25.6664 34.6834 25.8589 34.5106 25.8589 34.273V31.9185C25.8589 31.7025 25.6664 31.5081 25.4526 31.5081H20.5767V28.8297H26.5004C26.7357 28.8297 26.9068 28.6353 26.9068 28.4193V26.0649C26.9068 25.8489 26.7357 25.6545 26.5004 25.6545H17.6469C17.4116 25.6545 17.2405 25.8489 17.2405 26.0649L17.2405 40.3642Z"
                      fill="white"
                    ></path>
                    <path
                      d="M29.6415 40.1698C29.449 40.4506 29.6415 40.7746 30.0051 40.7746H32.9776C33.1487 40.7746 33.277 40.6666 33.3412 40.5802L36.0785 36.217H36.1213L38.9228 40.5802C38.987 40.6882 39.1581 40.7746 39.2864 40.7746H42.259C42.6011 40.7746 42.7936 40.4722 42.6011 40.1698L38.1102 33.0202L42.4514 26.2593C42.6439 25.9785 42.4514 25.6545 42.0879 25.6545H38.9656C38.8159 25.6545 38.6662 25.7625 38.6234 25.8489L36.1213 29.8665H36.0999L33.6406 25.8489C33.5764 25.7625 33.4481 25.6545 33.2984 25.6545H30.1761C29.8126 25.6545 29.6415 25.9785 29.8126 26.2593L34.1325 33.0202L29.6415 40.1698Z"
                      fill="white"
                    ></path>
                    <path
                      d="M43.6813 33.2362C43.6813 37.5562 47.0815 40.9906 51.3586 40.9906C55.6357 40.9906 59.0574 37.5562 59.0574 33.2362C59.0574 28.9161 55.6357 25.4385 51.3586 25.4385C47.0815 25.4385 43.6813 28.9161 43.6813 33.2362ZM47.1029 33.2362C47.1029 30.8601 49.0276 28.8945 51.3586 28.8945C53.7111 28.8945 55.6357 30.8601 55.6357 33.2362C55.6357 35.5906 53.7111 37.5346 51.3586 37.5346C49.0276 37.5346 47.1029 35.5906 47.1029 33.2362Z"
                      fill="white"
                    ></path>
                    <path
                      d="M61.6464 40.3642C61.6464 40.5802 61.8175 40.7746 62.0527 40.7746H70.0937C70.3289 40.7746 70.5 40.5802 70.5 40.3642V38.0098C70.5 37.7938 70.3289 37.5994 70.0937 37.5994H65.0039V26.0649C65.0039 25.8489 64.8115 25.6545 64.5976 25.6545H62.0527C61.8175 25.6545 61.6464 25.8489 61.6464 26.0649V40.3642Z"
                      fill="white"
                    ></path>
                    <path
                      d="M34.0244 57.9309V69.9999H45.8919V57.9309H34.0244ZM43.5184 67.5861H36.3979V60.3447H43.5184V67.5861Z"
                      fill="white"
                    ></path>
                    <path d="M69.6294 43.4482H67.2559V55.5172H69.6294V43.4482Z" fill="white"></path>
                    <path d="M30.4468 0H17.3926V13.2759H30.4468V0Z" fill="white"></path>
                  </g>
                  <defs>
                    <clipPath id="clip0_1401_144">
                      <rect width="70" height="70" fill="white" transform="translate(0.361328)"></rect>
                    </clipPath>
                  </defs>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
