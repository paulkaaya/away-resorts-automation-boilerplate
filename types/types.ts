import { CallbackForm } from '@components/CallbackForm';
import { ContactForm } from '@components/ContactForm';
import { CookieBanner } from '@components/CookieBanner';
import { EnquiryForm } from '@components/EnquiryForm';
import { FooterNav } from '@components/FooterNavigation';
import { HeaderNav } from '@components/HeaderNavigation';
import { LoginForm } from '@components/LoginForm';
import { NewsletterForm } from '@components/NewsletterForm';
import { ViewingForm } from '@components/ViewingForm';
import { BasePage } from '@pages/BasePage';
import { ConfirmationPage } from '@pages/ConfirmationPage';
import { DetailsPage } from '@pages/DetailsPage';
import { ExtrasPage } from '@pages/ExtrasPage';
import { HolidayHomeListingsPage } from '@pages/HolidayHomeListingsPage';
import { HolidayHomesPage } from '@pages/HolidayHomesPage';
import { HomePage } from '@pages/HomePage';
import { NotFoundPage } from '@pages/NotFoundPage';
import { PaymentPage } from '@pages/PaymentPage';
import { SearchBarPage } from '@pages/SearchBarPage';

export type Pages = {
  basePage: BasePage;
  homePage: HomePage;
  notFoundPage: NotFoundPage;
  searchBarPage: SearchBarPage;
  extrasPage: ExtrasPage;
  detailsPage: DetailsPage;
  paymentPage: PaymentPage;
  confirmationPage: ConfirmationPage;
  holidayHomesPage: HolidayHomesPage;
  holidayHomeListingsPage: HolidayHomeListingsPage;
};

export type Components = {
  headerNavigation: HeaderNav;
  footerNavigation: FooterNav;
  cookieBanner: CookieBanner;
  callbackForm: CallbackForm;
  viewingForm: ViewingForm;
  enquiryForm: EnquiryForm;
  contactForm: ContactForm;
  newsletterForm: NewsletterForm;
  loginForm: LoginForm;
};
