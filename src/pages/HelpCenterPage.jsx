import React, { useState } from 'react';
import { API_URL } from '../utils/api';
import { useUser } from '../context/UserContext';

const HelpCenterPage = ({ onBack }) => {
  const { user } = useUser();
  const [activeSection, setActiveSection] = useState('updates'); // 'updates', 'features', 'faqs', 'resources', 'contact'
  const [openFAQ, setOpenFAQ] = useState(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  
  // Ticket form state
  const [ticketForm, setTicketForm] = useState({
    email: user?.email || '',
    subject: '',
    category: 'general',
    message: ''
  });

  const API_BASE = `${API_URL}/api/help`;

  // FAQs organized by category
  const faqs = {
    'Getting Started': [
      {
        id: 1,
        question: 'How do I add cards to my collection?',
        answer: 'You can add cards to your collection in several ways:\n\n1. Search for cards using the search bar and click on a card to view details, then add it to your collection\n2. Browse sets and click on cards to add them\n3. Import cards from a CSV file in the Settings page\n4. Use the "Add to Collection" button when viewing card details'
      },
      {
        id: 2,
        question: 'How do I create a new collection?',
        answer: 'Collections are automatically created when you first add cards. You can organize cards into different collections by using the Collections section in the menu. Each collection allows you to track different sets of cards separately.'
      },
      {
        id: 3,
        question: 'What is the difference between a collection and a wishlist?',
        answer: 'Your collection contains cards you own, while your wishlist contains cards you want to collect but don\'t currently have. You can add cards to your wishlist from any card view, and they will be saved separately from your collection.'
      },
      {
        id: 4,
        question: 'How do I track card prices?',
        answer: 'Card prices are automatically updated from TCGPlayer and other sources. You can view current prices, price history charts, and set price alerts for cards you\'re interested in. Price data is updated regularly to keep you informed about market trends.'
      }
    ],
    'Collections & Cards': [
      {
        id: 5,
        question: 'Can I add multiple copies of the same card?',
        answer: 'Yes! When adding a card to your collection, you can specify the quantity. The app tracks how many copies you have of each card, including different variants, conditions, and graded versions.'
      },
      {
        id: 6,
        question: 'How do I track graded cards?',
        answer: 'When adding a card, you can mark it as graded and specify the grading company (PSA, BGS, CGC, etc.) and grade value. This helps you track the condition and value of your graded cards separately from ungraded versions.'
      },
      {
        id: 7,
        question: 'What information can I add to each card?',
        answer: 'For each card in your collection, you can track:\n• Variant (Normal, Holo, Reverse Holo, etc.)\n• Condition (Near Mint, Lightly Played, etc.)\n• Grading information (if graded)\n• Purchase price and date\n• Quantity\n• Personal notes'
      },
      {
        id: 8,
        question: 'How do I export my collection data?',
        answer: 'You can export your collection data by using the CSV import/export feature in Settings. While export functionality is coming soon, you can currently import collections from CSV files.'
      }
    ],
    'Pricing & Market': [
      {
        id: 9,
        question: 'Where do card prices come from?',
        answer: 'Card prices are sourced from TCGPlayer, Pokemon Price Tracker API, and other market data sources. Prices are updated regularly to reflect current market conditions. We show market price, low price, mid price, and high price for reference.'
      },
      {
        id: 10,
        question: 'How often are prices updated?',
        answer: 'Prices are updated automatically on a regular schedule. The frequency depends on the data source and market activity. High-demand cards may have more frequent updates.'
      },
      {
        id: 11,
        question: 'Can I set price alerts?',
        answer: 'Yes! You can set price alerts for cards you\'re interested in. When a card reaches your target price, you\'ll receive a notification. Enable price alerts in your Settings page.'
      },
      {
        id: 12,
        question: 'Why are some cards missing price information?',
        answer: 'Some cards, especially very new or rare cards, may not have price data available yet. Price information is dependent on market listings and may take time to appear for newly released cards.'
      }
    ],
    'Community & Social': [
      {
        id: 13,
        question: 'How do I use the community features?',
        answer: 'The Community page allows you to:\n• Share posts about your collection\n• Ask questions about cards\n• Upload photos of your cards\n• Follow other collectors\n• Comment on posts and engage with the community'
      },
      {
        id: 14,
        question: 'How do I make my profile public or private?',
        answer: 'You can control your privacy settings in the Settings page. You can choose to make your profile public, your collection visible to others, and whether to show your email or activity.'
      },
      {
        id: 15,
        question: 'Can I follow other collectors?',
        answer: 'Yes! You can follow other collectors to see their posts and activity. Visit their profile page and click the "Follow" button. You can see who you\'re following in your profile.'
      }
    ],
    'Technical': [
      {
        id: 16,
        question: 'How do I import my collection from a CSV file?',
        answer: 'Go to Settings > Data & Import section. Download the CSV template, fill it with your card data, and upload it. Make sure to include at least the card_id or product_id for each card. The app will validate and import your data.'
      },
      {
        id: 17,
        question: 'What CSV format should I use?',
        answer: 'Download the template from Settings to see the exact format. Required fields include card_id or product_id. Optional fields include variant, condition, quantity, purchase_price, purchase_date, notes, and grading information.'
      },
      {
        id: 18,
        question: 'I\'m having trouble logging in. What should I do?',
        answer: 'Make sure you\'re using the correct email and password. If you forgot your password, use the password reset feature. If problems persist, submit a support ticket and we\'ll help you resolve the issue.'
      },
      {
        id: 19,
        question: 'How do I change my username or email?',
        answer: 'Currently, username and email changes need to be done through support. Submit a ticket with your request and we\'ll help you update your account information.'
      }
    ]
  };

  // Pokemon TCG Resources
  const resources = [
    {
      title: 'Understanding Card Rarity',
      description: 'Learn about Common, Uncommon, Rare, Ultra Rare, and Secret Rare cards',
      content: `Pokemon cards come in different rarities:
      
• Common: Basic cards with a circle symbol
• Uncommon: Cards with a diamond symbol
• Rare: Cards with a star symbol
• Ultra Rare: Special cards like EX, GX, V, VMAX
• Secret Rare: Ultra-rare alternate art cards

Higher rarity cards are typically more valuable and harder to find.`
    },
    {
      title: 'Card Conditions',
      description: 'Understanding card condition grades and how they affect value',
      content: `Card condition is crucial for value:
      
• Mint (M): Perfect, pack-fresh condition
• Near Mint (NM): Minor wear, still excellent
• Lightly Played (LP): Some wear but still in good shape
• Moderately Played (MP): Noticeable wear
• Heavily Played (HP): Significant wear
• Damaged: Major defects affecting playability

Graded cards from PSA, BGS, or CGC provide standardized condition ratings from 1-10.`
    },
    {
      title: 'Set Symbols and Numbers',
      description: 'How to read set symbols and card numbers',
      content: `Each card has identifying information:
      
• Set Symbol: Shows which set the card belongs to
• Card Number: The card's number in the set (e.g., 25/132)
• Set Name: The name of the expansion set

Understanding these helps you identify cards and track your collection progress.`
    },
    {
      title: 'Grading Cards',
      description: 'An overview of professional card grading services',
      content: `Professional grading services evaluate cards:
      
• PSA (Professional Sports Authenticator): Most popular for Pokemon
• BGS (Beckett Grading Services): Known for sub-grades
• CGC (Certified Guaranty Company): Growing in popularity

Grading considers:
- Centering
- Corners
- Edges
- Surface condition

Higher grades (9-10) significantly increase card value.`
    },
    {
      title: 'Card Variants',
      description: 'Understanding different card print variations',
      content: `Cards can have multiple variants:
      
• Normal: Standard printing
• Holo: Holographic foil pattern
• Reverse Holo: Holo pattern on the entire card
• Full Art: Artwork extends to card edges
• Alternate Art: Different artwork than standard
• Rainbow Rare: Multi-color holographic pattern
• Gold Rare: Gold-colored variant

Each variant affects value and collectibility.`
    },
    {
      title: 'First Edition vs Unlimited',
      description: 'The difference between first edition and unlimited print runs',
      content: `Important distinction for older cards:
      
• First Edition: Initial print run with "1st Edition" stamp
• Unlimited: Subsequent print runs without the stamp

First Edition cards are typically more valuable, especially for vintage sets like Base Set, Jungle, and Fossil.`
    }
  ];

  // Handle ticket submission
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    
    if (!ticketForm.email || !ticketForm.subject || !ticketForm.message) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(`${API_BASE}/tickets`, {
        method: 'POST',
        headers,
        body: JSON.stringify(ticketForm)
      });

      if (!response.ok) throw new Error('Failed to submit ticket');

      const result = await response.json();
      if (result.success) {
        setTicketSubmitted(true);
        setTicketForm({
          email: user?.email || '',
          subject: '',
          category: 'general',
          message: ''
        });
        setTimeout(() => {
          setShowTicketForm(false);
          setTicketSubmitted(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting ticket:', error);
      alert('Failed to submit ticket. Please try again.');
    }
  };

  return (
    <div 
      className="min-h-screen text-theme-primary transition-all duration-300 ease-in-out relative bg-theme-gradient"
      style={{
        height: '100vh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div className="bg-theme-glass dark:bg-black/20 backdrop-blur-sm border-b border-theme sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="w-10 h-10 bg-theme-card dark:bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center hover:bg-theme-card-hover dark:hover:bg-white/20 transition-all duration-200 border border-theme"
            >
              <svg className="w-5 h-5 text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-theme-primary">Help Center</h1>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center px-4 pb-2 border-b border-theme overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveSection('updates')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeSection === 'updates' ? 'text-theme-primary' : 'text-theme-secondary hover:text-theme-primary'
            }`}
          >
            Updates
            {activeSection === 'updates' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveSection('features')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeSection === 'features' ? 'text-theme-primary' : 'text-theme-secondary hover:text-theme-primary'
            }`}
          >
            Features
            {activeSection === 'features' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveSection('faqs')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeSection === 'faqs' ? 'text-theme-primary' : 'text-theme-secondary hover:text-theme-primary'
            }`}
          >
            FAQs
            {activeSection === 'faqs' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveSection('resources')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeSection === 'resources' ? 'text-theme-primary' : 'text-theme-secondary hover:text-theme-primary'
            }`}
          >
            Pokemon TCG Resources
            {activeSection === 'resources' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveSection('contact')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeSection === 'contact' ? 'text-theme-primary' : 'text-theme-secondary hover:text-theme-primary'
            }`}
          >
            Contact Support
            {activeSection === 'contact' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-24 max-w-4xl mx-auto">
        {/* Updates */}
        {activeSection === 'updates' && (
          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">Latest</span>
                <span className="text-theme-tertiary text-sm">November 2024</span>
              </div>
              <h2 className="text-xl font-bold text-theme-primary mb-3">Help Center & Support System</h2>
              <div className="text-theme-secondary space-y-2">
                <p>We've added a comprehensive Help Center to assist you with using the app!</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>New Help Center page with FAQs and resources</li>
                  <li>Support ticket system for contacting the dev team</li>
                  <li>Pokemon TCG educational resources</li>
                  <li>This updates section to keep you informed</li>
                </ul>
              </div>
            </div>

            <div className="bg-theme-card backdrop-blur-sm rounded-xl p-6 border border-theme">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-theme-tertiary text-sm">November 2024</span>
              </div>
              <h2 className="text-xl font-bold text-theme-primary mb-3">Wishlist Feature</h2>
              <div className="text-theme-secondary space-y-2">
                <p>Track cards you want to collect with the new Wishlist feature!</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Add cards to your wishlist from any card view</li>
                  <li>Set priority levels (High, Medium, Low)</li>
                  <li>Add max price limits and notes</li>
                  <li>View all wishlist items in a dedicated page</li>
                </ul>
              </div>
            </div>

            <div className="bg-theme-card backdrop-blur-sm rounded-xl p-6 border border-theme">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-theme-tertiary text-sm">October 2024</span>
              </div>
              <h2 className="text-xl font-bold text-theme-primary mb-3">Community Features</h2>
              <div className="text-theme-secondary space-y-2">
                <p>The Community page is now live with real data!</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Share posts, photos, and questions</li>
                  <li>Follow other collectors</li>
                  <li>Like and comment on posts</li>
                  <li>All data is now stored in the database</li>
                </ul>
              </div>
            </div>

            <div className="bg-theme-card backdrop-blur-sm rounded-xl p-6 border border-theme">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-theme-tertiary text-sm">October 2024</span>
              </div>
              <h2 className="text-xl font-bold text-theme-primary mb-3">CSV Import Feature</h2>
              <div className="text-theme-secondary space-y-2">
                <p>You can now import your collection from CSV files!</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Download CSV template from Settings</li>
                  <li>Bulk import cards with all details</li>
                  <li>Support for variants, conditions, and grading info</li>
                  <li>Duplicate handling options</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        {activeSection === 'features' && (
          <div className="space-y-6">
            <div className="bg-theme-card backdrop-blur-sm rounded-xl p-6 border border-theme">
              <h2 className="text-xl font-bold text-theme-primary mb-4">Key Features</h2>
              <div className="space-y-4 text-theme-secondary">
                <div>
                  <h3 className="text-theme-primary font-semibold mb-2">Collection Management</h3>
                  <p>Track all your cards with details like condition, variant, and grading. Organize cards into collections and view your progress across different sets.</p>
                </div>

                <div>
                  <h3 className="text-theme-primary font-semibold mb-2">Price Tracking</h3>
                  <p>Real-time prices from TCGPlayer and market data. View current prices, price history charts, and set price alerts for cards you're interested in.</p>
                </div>

                <div>
                  <h3 className="text-theme-primary font-semibold mb-2">Set Progression</h3>
                  <p>See your completion progress for each set. Track which cards you own and which ones you still need to complete your collection.</p>
                </div>

                <div>
                  <h3 className="text-theme-primary font-semibold mb-2">Deck Builder</h3>
                  <p>Build and test Pokemon TCG decks. Validate deck legality, test strategies, and track your deck performance.</p>
                </div>

                <div>
                  <h3 className="text-theme-primary font-semibold mb-2">Binder View</h3>
                  <p>Organize cards in virtual binders. Create custom binder layouts and organize your collection visually.</p>
                </div>

                <div>
                  <h3 className="text-theme-primary font-semibold mb-2">Community</h3>
                  <p>Share posts, ask questions, and follow other collectors. Upload photos of your cards and engage with the community.</p>
                </div>

                <div>
                  <h3 className="text-theme-primary font-semibold mb-2">Wishlist</h3>
                  <p>Keep track of cards you want to collect. Set priority levels, max prices, and notes for each wishlist item.</p>
                </div>

                <div>
                  <h3 className="text-theme-primary font-semibold mb-2">CSV Import</h3>
                  <p>Bulk import your collection from CSV files. Download the template, fill in your data, and upload to quickly add cards to your collection.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAQs */}
        {activeSection === 'faqs' && (
          <div className="space-y-4">
            {Object.entries(faqs).map(([category, questions]) => (
              <div key={category} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold text-theme-primary mb-4">{category}</h2>
                <div className="space-y-3">
                  {questions.map((faq) => (
                    <div key={faq.id} className="border-b border-theme last:border-0 pb-3 last:pb-0">
                      <button
                        onClick={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}
                        className="w-full text-left flex items-center justify-between gap-4"
                      >
                        <span className="text-theme-primary font-medium">{faq.question}</span>
                        <svg
                          className={`w-5 h-5 text-theme-tertiary transition-transform flex-shrink-0 ${
                            openFAQ === faq.id ? 'transform rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {openFAQ === faq.id && (
                        <div className="mt-3 text-theme-secondary whitespace-pre-line">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resources */}
        {activeSection === 'resources' && (
          <div className="space-y-4">
            {resources.map((resource, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold text-theme-primary mb-2">{resource.title}</h2>
                <p className="text-theme-tertiary text-sm mb-4">{resource.description}</p>
                <div className="text-theme-secondary whitespace-pre-line">
                  {resource.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Support */}
        {activeSection === 'contact' && (
          <div className="space-y-6">
            <div className="bg-theme-card backdrop-blur-sm rounded-xl p-6 border border-theme">
              <h2 className="text-xl font-bold text-theme-primary mb-4">Contact Support</h2>
              <p className="text-theme-secondary mb-6">
                Need help? Submit a support ticket and our team will get back to you as soon as possible.
              </p>

              {!showTicketForm && !ticketSubmitted && (
                <button
                  onClick={() => setShowTicketForm(true)}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-medium transition-all"
                >
                  Submit Support Ticket
                </button>
              )}

              {ticketSubmitted && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                  <p className="text-green-400 font-medium">Ticket submitted successfully!</p>
                  <p className="text-theme-secondary text-sm mt-2">We'll get back to you soon via email.</p>
                </div>
              )}

              {showTicketForm && !ticketSubmitted && (
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div>
                    <label className="block text-theme-primary text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      value={ticketForm.email}
                      onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                      required
                      className="w-full dark:bg-gray-700 bg-gray-100 rounded-lg px-4 py-2 text-theme-primary placeholder-theme-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-theme-primary text-sm font-medium mb-2">Category *</label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                      className="w-full dark:bg-gray-700 bg-gray-100 rounded-lg px-4 py-2 text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Issue</option>
                      <option value="account">Account Issue</option>
                      <option value="feature">Feature Request</option>
                      <option value="bug">Bug Report</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-theme-primary text-sm font-medium mb-2">Subject *</label>
                    <input
                      type="text"
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                      required
                      className="w-full dark:bg-gray-700 bg-gray-100 rounded-lg px-4 py-2 text-theme-primary placeholder-theme-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Brief description of your issue"
                    />
                  </div>

                  <div>
                    <label className="block text-theme-primary text-sm font-medium mb-2">Message *</label>
                    <textarea
                      value={ticketForm.message}
                      onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                      required
                      rows="6"
                      className="w-full dark:bg-gray-700 bg-gray-100 rounded-lg px-4 py-2 text-theme-primary placeholder-theme-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Please describe your issue or question in detail..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-medium transition-all"
                    >
                      Submit Ticket
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTicketForm(false);
                        setTicketForm({
                          email: user?.email || '',
                          subject: '',
                          category: 'general',
                          message: ''
                        });
                      }}
                      className="px-6 py-2 dark:bg-gray-700 bg-gray-200 dark:hover:bg-gray-600 hover:bg-gray-300 text-theme-primary rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20 rounded-xl p-6">
              <h3 className="text-theme-primary font-semibold mb-2">Other Ways to Get Help</h3>
              <ul className="space-y-2 text-theme-secondary text-sm">
                <li>• Check the FAQs section for common questions</li>
                <li>• Browse the Pokemon TCG Resources for card information</li>
                <li>• Join the community to ask questions and get help from other collectors</li>
                <li>• Review the Getting Started guide for app basics</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpCenterPage;

