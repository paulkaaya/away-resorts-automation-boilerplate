import { FooterNav } from '@components/FooterNavigation';
import { HeaderNav } from '@components/HeaderNavigation';
import { BasePage } from '@pages/BasePage';
import { HomePage } from '@pages/HomePage';

export type Pages = {
  basePage: BasePage;
  homePage: HomePage;
};

export type Components = {
  headerNavigation: HeaderNav;
  footerNavigation: FooterNav;
};
