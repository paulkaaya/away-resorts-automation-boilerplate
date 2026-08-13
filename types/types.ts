import { FooterNav } from '@components/FooterNavigation';
import { HeaderNav } from '@components/HeaderNavigation';
import { BasePage } from '@pages/BasePage';
import { LoginPage } from '@pages/LoginPage';

export type Pages = {
  basePage: BasePage;
  loginPage: LoginPage;
};

export type Components = {
  headerNavigation: HeaderNav;
  footerNavigation: FooterNav;
};
