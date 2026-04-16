import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export type Language = 'uk' | 'en';
export type Currency = 'UAH' | 'USD' | 'EUR';

interface ExchangeRate {
    currency: string;
    rate: number;
}

interface SettingsContextType {
    language: Language;
    currency: Currency;
    setLanguage: (lang: Language) => void;
    setCurrency: (curr: Currency) => void;
    t: (key: string) => string;
    getErrorMessage: (err: any, fallback?: string) => string;
    formatPrice: (uahAmount: number) => string;
    publicSettings: Record<string, string>;
    maintenanceMode: boolean;
    isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
    uk: {
        'nav.tours': 'Тури',
        'nav.hotels': 'Готелі',
        'nav.excursions': 'Екскурсії',
        'nav.cruises': 'Круїзи',
        'nav.search': 'Країна, місто або курорт...',
        'auth.signin': 'Увійти',
        'auth.register': 'Реєстрація',
        'tour.reviews': 'відгуків',
        'tour.book': 'Забронювати',
        'tour.details': 'Деталі туру',
        'tour.description': 'Опис',
        'tour.accommodation': 'Проживання',
        'tour.flights': 'Перельоти',
        'tour.program': 'Програма',
        'tour.location': 'Локація',
        'tour.price_from': 'від',
        'tour.per_person': '/ особа',
        'common.loading': 'Завантаження...',
        'profile.bookings': 'Мої бронювання',
        'profile.admin': 'Адмін-панель',
        'profile.logout': 'Вийти',
        'search.found': 'Знайдено',
        'search.all_destinations': 'Всі напрямки',
        'search.sort_by': 'Сортувати',
        'search.no_tours': 'За вашими фільтрами турів не знайдено.',
        'filter.title': 'Фільтри',
        'filter.reset': 'Скинути',
        'filter.price_per_person': 'Ціна за особу',
        'filter.stars': 'Зірковість',
        'filter.meal_type': 'Харчування',
        'hero.title': 'Відкрий світ<br />разом з Pomelo',
        'hero.subtitle': 'Найкращі пропозиції для вашого незабутнього відпочинку',
        'hero.where': 'Куди?',
        'hero.when': 'Коли?',
        'hero.who': 'Осіб',
        'hero.dest_placeholder': 'Оберіть напрямок',
        'hero.date_placeholder': 'Оберіть дати',
        'hero.btn_search': 'Шукати',
        'trending.title': 'Популярні тури',
        'trending.subtitle': 'Те, що обирають наші клієнти найчастіше',
        'see_all': 'Дивитися всі',
        'nav.home': 'Головна',
        'tab.desc': 'Опис',
        'tab.acc': 'Проживання',
        'tab.flights': 'Перельоти',
        'tab.program': 'Програма',
        'tab.reviews': 'Відгуки',
        'tour.about': 'Про тур',
        'tour.amenities': 'Зручності',
        'tour.no_reviews': 'Поки немає відгуків. Будьте першим!',
        'tour.review_placeholder': 'Поділіться вашими враженнями...',
        'booking.date': 'ДАТА ВИЛЬОТУ',
        'booking.nights': 'НОЧЕЙ',
        'booking.travelers': 'ТУРИСТИ',
        'booking.total': 'Разом',
        'booking.book_btn': 'Забронювати',
        'booking.processing': 'Обробка...',
        'booking.success_title': 'Бронювання підтверджено!',
        'common.adults': 'дорослих',
        'common.adult': 'дорослий',
        'common.children': 'дітей',
        'common.child': 'дитина',
        'common.nights': 'ночей',
        'common.people': 'осіб',
        'common.done': 'Готово',
        'auth.welcome_back': 'З поверненням!',
        'auth.login_subtitle': 'Увійдіть, щоб керувати своїми мандрівками',
        'auth.create_account': 'Створити акаунт',
        'auth.register_subtitle': 'Приєднуйтесь до спільноти Pomelo Travel',
        'auth.email': 'EMAIL',
        'auth.password': 'ПАРОЛЬ',
        'auth.full_name': "ПОВНЕ ІМ'Я",
        'auth.name_placeholder': "Ваше ім'я (наприклад, Іван Іванов)",
        'auth.remember_me': "Запам'ятати мене",
        'auth.forgot_password': 'Забули пароль?',
        'auth.login_btn': 'Увійти',
        'auth.register_btn': 'Зареєструватися',
        'auth.or_login_via': 'або увійдіть через',
        'auth.no_account': 'Немає акаунту?',
        'auth.have_account': 'Вже маєте акаунт?',
        'auth.login_link': 'Увійти в систему',
        'support.title': 'Pomelo-підтримка',
        'support.online': 'Онлайн',
        'support.welcome': 'Привіт! Чим можу допомогти з вибором туру? 🍊',
        'support.bubble_welcome': 'Привіт! Потрібна допомога?',
        'support.placeholder': 'Напишіть нам...',
        'support.login_required': 'Увійдіть, щоб написати',
        'support.emoji': 'Емодзі',
        'support.attach': 'Прикріпити файл',
        'support.file_attached': 'Файл вкладено',
        'amenity.wifi': 'Wi-Fi',
        'amenity.pool': 'Басейн',
        'amenity.beach': 'Пляж',
        'amenity.spa': 'Спа',
        'amenity.restaurant': 'Ресторани',
        'amenity.gym': 'Тренажер',
        'profile.favorites': 'Вибране',
        'profile.settings': 'Налаштування',
        'profile.wallet': 'Гаманець',
        'profile.profile_updated': 'Профіль оновлено!',
        'profile.update_success': 'Ваші дані успішно збережено.',
        'profile.update_error': 'Помилка оновлення',
        'profile.balance': 'Ваш баланс',
        'wallet.available': 'ДОСТУПНО',
        'wallet.topup': 'Поповнити баланс',
        'wallet.recent_transactions': 'Останні транзакції',
        'wallet.no_transactions': 'У вас ще немає транзакцій',
        'wallet.deposit': 'Поповнення',
        'wallet.payment': 'Оплата',
        'wallet.topup_success': 'Баланс поповнено!',
        'wallet.topup_success_msg': 'Рахунок успішно поповнено на ₴ {amount}. Ваш новий баланс: {balance}.',
        'admin.dashboard': 'Дашборд',
        'admin.tours': 'Управління турами',
        'admin.bookings': 'Бронювання',
        'admin.managers': 'Менеджери',
        'admin.support': 'Служба підтримки',
        'admin.settings': 'Налаштування',
        'admin.back_to_site': 'На головну сайту',
        'admin.new_tour': 'Новий тур',
        'cat.cities': 'Міста',
        'cat.all': 'Всі категорії',
        'tour.description_fallback': 'Відкрийте для себе красу',
        'error.network': 'Помилка мережі. Перевірте з\'єднання з інтернетом.',
        'error.server': 'Сервер тимчасово недоступний. Спробуйте пізніше.',
        'error.unknown': 'Сталася непередбачувана помилка.',
        'error.auth': 'Помилка авторизації. Перевірте дані.',
        'book.success_msg': 'Тур успішно заброньовано. Деталі з\'являться у вашому кабінеті.',
        'book.error_title': 'Помилка бронювання',
        'book.error_msg': 'Не вдалося створити бронювання. Спробуйте ще раз.',
        'book.insufficient_balance': 'Недостатньо коштів на балансі.',
        'hero.dates.next_7': 'Найближчі 7 днів',
        'hero.dates.all_month': 'Весь {month}',
        'hero.dates.season': 'Оксамитовий сезон',
        'hero.who.adult': '{count} дорослий',
        'hero.who.adults': '{count} дорослих',
        'hero.who.child': '{count} дитина',
        'nf.title': 'Упс! Схоже, цей острів ще не відкрито',
        'nf.text': 'Ми не змогли знайти сторінку, яку ви шукаєте. Можливо, вона переїхала або ніколи не існувала.',
        'nf.back_home': 'Додому',
        'nf.search_tours': 'Шукати тури',
    },
    en: {
        'nav.tours': 'Tours',
        'nav.hotels': 'Hotels',
        'nav.excursions': 'Excursions',
        'nav.cruises': 'Cruises',
        'nav.search': 'Country, city or resort...',
        'auth.signin': 'Sign In',
        'auth.register': 'Register',
        'tour.reviews': 'reviews',
        'tour.book': 'Book Now',
        'tour.details': 'Tour Details',
        'tour.description': 'Description',
        'tour.accommodation': 'Accommodation',
        'tour.flights': 'Flights',
        'tour.program': 'Itinerary',
        'tour.location': 'Location',
        'tour.price_from': 'from',
        'tour.per_person': '/ person',
        'common.loading': 'Loading...',
        'profile.bookings': 'My Bookings',
        'profile.admin': 'Admin Panel',
        'profile.logout': 'Sign Out',
        'search.found': 'Found',
        'search.all_destinations': 'All destinations',
        'search.sort_by': 'Sort by',
        'search.no_tours': 'No tours found for your filters.',
        'filter.title': 'Filters',
        'filter.reset': 'Reset',
        'filter.price_per_person': 'Price per person',
        'filter.stars': 'Stars',
        'filter.meal_type': 'Meals',
        'hero.title': 'Discover the world<br />with Pomelo',
        'hero.subtitle': 'The best deals for your unforgettable vacation',
        'hero.where': 'Where?',
        'hero.when': 'When?',
        'hero.who': 'People',
        'hero.dest_placeholder': 'Select destination',
        'hero.date_placeholder': 'Select dates',
        'hero.btn_search': 'Search',
        'trending.title': 'Trending Tours',
        'trending.subtitle': 'Frequently chosen by our clients',
        'see_all': 'See all',
        'nav.home': 'Home',
        'tab.desc': 'Description',
        'tab.acc': 'Accommodation',
        'tab.flights': 'Flights',
        'tab.program': 'Itinerary',
        'tab.reviews': 'Reviews',
        'tour.about': 'About this tour',
        'tour.amenities': 'Amenities',
        'tour.no_reviews': 'No reviews yet. Be the first!',
        'tour.review_placeholder': 'Share your experience...',
        'booking.date': 'DEPARTURE DATE',
        'booking.nights': 'NIGHTS',
        'booking.travelers': 'TRAVELERS',
        'booking.total': 'Total',
        'booking.book_btn': 'Book Now',
        'booking.processing': 'Processing...',
        'booking.success_title': 'Booking Confirmed!',
        'common.adults': 'Adults',
        'common.children': 'Children',
        'common.nights': 'nights',
        'common.people': 'people',
        'common.done': 'Done',
        'auth.welcome_back': 'Welcome back!',
        'auth.login_subtitle': 'Login to manage your travels',
        'auth.create_account': 'Create an account',
        'auth.register_subtitle': 'Join the Pomelo Travel community',
        'auth.email': 'EMAIL',
        'auth.password': 'PASSWORD',
        'auth.full_name': 'FULL NAME',
        'auth.name_placeholder': 'Your name (e.g., John Doe)',
        'auth.remember_me': 'Remember me',
        'auth.forgot_password': 'Forgot password?',
        'auth.login_btn': 'Sign In',
        'auth.register_btn': 'Register',
        'auth.or_login_via': 'or sign in via',
        'auth.no_account': 'No account?',
        'auth.have_account': 'Already have an account?',
        'auth.login_link': 'Login here',
        'support.title': 'Pomelo Support',
        'support.online': 'Online',
        'support.welcome': 'Hello! How can I help you choose a tour? 🍊',
        'support.bubble_welcome': 'Hi! Need help?',
        'support.placeholder': 'Write to us...',
        'support.login_required': 'Login to chat',
        'support.emoji': 'Emoji',
        'support.attach': 'Attach file',
        'support.file_attached': 'File attached',
        'book.error_title': 'Booking Error',
        'book.error_msg': 'Failed to create booking. Please try again.',
        'book.insufficient_balance': 'Insufficient balance in your wallet.',
        'amenity.wifi': 'Wi-Fi',
        'amenity.pool': 'Pool',
        'amenity.beach': 'Beach',
        'amenity.spa': 'Spa',
        'amenity.restaurant': 'Restaurants',
        'amenity.gym': 'Gym',
        'profile.favorites': 'Favorites',
        'profile.settings': 'Settings',
        'profile.wallet': 'Wallet',
        'profile.profile_updated': 'Profile Updated!',
        'profile.update_success': 'Your data has been saved successfully.',
        'profile.update_error': 'Update Error',
        'profile.balance': 'Your balance',
        'wallet.available': 'AVAILABLE',
        'wallet.topup': 'Top up balance',
        'wallet.recent_transactions': 'Recent transactions',
        'wallet.no_transactions': 'No transactions yet',
        'wallet.deposit': 'Deposit',
        'wallet.payment': 'Payment',
        'wallet.topup_success': 'Balance Topped Up!',
        'wallet.topup_success_msg': 'Account successfully topped up with ₴ {amount}. New balance: {balance}.',
        'admin.dashboard': 'Dashboard',
        'admin.tours': 'Manage Tours',
        'admin.bookings': 'Bookings',
        'admin.managers': 'Managers',
        'admin.support': 'Support Center',
        'admin.settings': 'Settings',
        'admin.back_to_site': 'Back to Site',
        'admin.new_tour': 'New Tour',
        'cat.cities': 'Cities',
        'cat.all': 'All Categories',
        'tour.description_fallback': 'Explore the beauty of',
        'error.network': 'Network error. Please check your internet connection.',
        'error.server': 'Server is temporarily unavailable. Please try again later.',
        'error.unknown': 'An unexpected error occurred.',
        'error.auth': 'Authentication failed. Please check your credentials.',
        'nf.title': 'Oops! It looks like this island hasn\'t been discovered yet',
        'nf.text': 'We couldn\'t find the page you\'re looking for. It might have moved or never existed.',
        'nf.back_home': 'Back Home',
        'nf.search_tours': 'Search Tours',
        'hero.dates.next_7': 'Next 7 days',
        'hero.dates.all_month': 'All of {month}',
        'hero.dates.season': 'Velvet season'
    }
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => 
        (localStorage.getItem('pomelo_lang') as Language) || 'uk'
    );
    const [currency, setCurrencyState] = useState<Currency>(() => 
        (localStorage.getItem('pomelo_curr') as Currency) || 'UAH'
    );
    const [rates, setRates] = useState<Record<string, number>>({ USD: 43.55, EUR: 51.29 });
    const [publicSettings, setPublicSettings] = useState<Record<string, string>>({});
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initSettings = async () => {
            try {
                // Fetch rates and public settings in parallel
                const [ratesData, settingsData] = await Promise.all([
                    api.get('/exchange-rates'),
                    api.get('/settings/public')
                ]);

                // Update rates
                const rateMap: Record<string, number> = {};
                ratesData.forEach((r: ExchangeRate) => {
                    rateMap[r.currency] = r.rate;
                });
                setRates(prev => ({ ...prev, ...rateMap }));

                // Update public settings
                setPublicSettings(settingsData);
                setMaintenanceMode(settingsData.maintenance_mode === 'true');
                
            } catch (error) {
                console.error('Failed to initialize settings:', error);
            } finally {
                setIsLoading(false);
            }
        };
        initSettings();
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('pomelo_lang', lang);
    };

    const setCurrency = (curr: Currency) => {
        setCurrencyState(curr);
        localStorage.setItem('pomelo_curr', curr);
    };

    const t = useCallback((key: string, fallback?: string) => {
        return translations[language][key] || fallback || key;
    }, [language]);

    const getErrorMessage = useCallback((err: any, fallback?: string) => {
        const msg = err?.message || '';
        if (msg === 'NETWORK_ERROR') return t('error.network');
        if (msg === 'TIMEOUT_ERROR') return t('error.server');
        if (msg === 'Insufficient balance') return t('book.insufficient_balance');
        if (msg === 'Incorrect email or password') return t('error.auth');
        
        // Handle common backend errors if they come as strings
        if (msg.includes('already registered')) return translations[language]['auth.error_exists'] || msg;
        
        return translations[language][msg] || fallback || msg || t('error.unknown');
    }, [language, t]);

    const formatPrice = useCallback((uahAmount: number) => {
        if (currency === 'UAH') {
            return `${uahAmount.toLocaleString()} ₴`;
        }
        
        const rate = rates[currency] || (currency === 'USD' ? 43.55 : 51.29);
        const converted = Math.round(uahAmount / rate);
        const symbol = currency === 'USD' ? '$' : '€';
        
        return `${symbol} ${converted.toLocaleString()}`;
    }, [currency, rates]);

    return (
        <SettingsContext.Provider value={{ language, currency, setLanguage, setCurrency, t, getErrorMessage, formatPrice, publicSettings, maintenanceMode, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettings must be used within SettingsProvider');
    return context;
};
