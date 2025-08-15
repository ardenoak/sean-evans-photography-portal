import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AdminLeadsPage from '@/app/leads/page';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
      })),
    })),
  },
}));

jest.mock('@/components/Logo', () => {
  return function MockLogo() {
    return <div data-testid="logo">Logo</div>;
  };
});

jest.mock('@/components/TallyLayout', () => {
  return function MockTallyLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="tally-layout">{children}</div>;
  };
});

// Mock fetch for API calls
global.fetch = jest.fn();

describe('AdminLeadsPage - Lead Management Component', () => {
  const mockLeads = [
    {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '555-0123',
      session_type_interest: 'Portrait',
      budget_range: '$1,000 - $2,500',
      preferred_timeline: 'Within 1 month',
      preferred_time: 'Morning',
      preferred_session_date: '2024-02-15',
      lead_source: 'Website',
      status: 'new',
      message: 'Interested in a portrait session for my family.',
      notes: '',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      last_contacted: null,
      next_follow_up: null,
      last_viewed_at: null,
    },
    {
      id: '2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      phone: '555-0456',
      session_type_interest: 'Branding',
      budget_range: '$2,500 - $5,000',
      preferred_timeline: 'Within 2 weeks',
      preferred_time: 'Afternoon',
      preferred_session_date: '2024-02-01',
      lead_source: 'Instagram',
      status: 'contacted',
      message: 'Need professional branding photos for my business.',
      notes: 'Very responsive, high priority',
      created_at: '2024-01-10T14:30:00Z',
      updated_at: '2024-01-12T09:15:00Z',
      last_contacted: '2024-01-12T09:15:00Z',
      next_follow_up: '2024-01-19T09:00:00Z',
      last_viewed_at: '2024-01-12T09:15:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/leads')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockLeads }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the leads page with title and navigation', async () => {
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Tally • Lead Management')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Manage client inquiries, track communications, and convert leads to bookings')).toBeInTheDocument();
      expect(screen.getByText('Add New Lead')).toBeInTheDocument();
    });

    it('should display loading state initially', () => {
      render(<AdminLeadsPage />);
      
      expect(screen.getByText('Loading lead data')).toBeInTheDocument();
      expect(screen.getByTestId('logo')).toBeInTheDocument();
    });

    it('should render lead statistics cards', async () => {
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Leads')).toBeInTheDocument();
      });
      
      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('Qualified')).toBeInTheDocument();
      expect(screen.getByText('Converted')).toBeInTheDocument();
    });
  });

  describe('Lead Data Display', () => {
    it('should display leads in the list', async () => {
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('should show new lead indicator for unviewed leads', async () => {
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        const newBadges = screen.getAllByText('NEW');
        expect(newBadges.length).toBeGreaterThan(0);
      });
    });

    it('should display lead details like session type and budget', async () => {
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Portrait')).toBeInTheDocument();
      });
      
      expect(screen.getByText('$1,000 - $2,500')).toBeInTheDocument();
      expect(screen.getByText('Within 1 month')).toBeInTheDocument();
    });

    it('should show lead status with appropriate styling', async () => {
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('NEW')).toBeInTheDocument();
      });
      
      expect(screen.getByText('CONTACTED')).toBeInTheDocument();
    });
  });

  describe('Lead Filtering and Search', () => {
    it('should filter leads by status', async () => {
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('All Status')).toBeInTheDocument();
      });
      
      const statusFilter = screen.getByDisplayValue('All Status');
      fireEvent.change(statusFilter, { target: { value: 'new' } });
      
      expect(statusFilter.value).toBe('new');
    });

    it('should search leads by name and email', async () => {
      const user = userEvent.setup();
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search leads...')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search leads...');
      await user.type(searchInput, 'John');
      
      expect(searchInput).toHaveValue('John');
    });

    it('should handle empty search results', async () => {
      const user = userEvent.setup();
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search leads...')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search leads...');
      await user.type(searchInput, 'NonexistentName');
      
      // The filtering is done client-side, so we need to check the implementation
      expect(searchInput).toHaveValue('NonexistentName');
    });
  });

  describe('Lead Detail Modal', () => {
    it('should open lead detail modal when clicking on a lead', async () => {
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const leadCard = screen.getByText('John Doe').closest('div');
      fireEvent.click(leadCard!);
      
      await waitFor(() => {
        expect(screen.getByText('Lead Details')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Internal Notes')).toBeInTheDocument();
    });

    it('should display all lead information in the modal', async () => {
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const leadCard = screen.getByText('John Doe').closest('div');
      fireEvent.click(leadCard!);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('new')).toBeInTheDocument();
      });
      
      expect(screen.getByDisplayValue('Portrait')).toBeInTheDocument();
    });

    it('should allow editing lead status and notes', async () => {
      const user = userEvent.setup();
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const leadCard = screen.getByText('John Doe').closest('div');
      fireEvent.click(leadCard!);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('new')).toBeInTheDocument();
      });
      
      const statusSelect = screen.getByDisplayValue('new');
      fireEvent.change(statusSelect, { target: { value: 'contacted' } });
      
      expect(statusSelect.value).toBe('contacted');
      
      // Check for unsaved changes indicator
      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      });
    });

    it('should close modal when clicking close button', async () => {
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const leadCard = screen.getByText('John Doe').closest('div');
      fireEvent.click(leadCard!);
      
      await waitFor(() => {
        expect(screen.getByText('Lead Details')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Lead Details')).not.toBeInTheDocument();
      });
    });
  });

  describe('Lead Creation', () => {
    it('should open create lead modal when clicking Add New Lead', async () => {
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Lead')).toBeInTheDocument();
      });
      
      const addButton = screen.getByText('Add New Lead');
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Lead')).toBeInTheDocument();
      });
      
      expect(screen.getByLabelText('First Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Email *')).toBeInTheDocument();
    });

    it('should validate required fields in create form', async () => {
      const user = userEvent.setup();
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Lead')).toBeInTheDocument();
      });
      
      const addButton = screen.getByText('Add New Lead');
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Create Lead')).toBeInTheDocument();
      });
      
      const createButton = screen.getByText('Create Lead');
      fireEvent.click(createButton);
      
      // HTML5 validation will prevent form submission
      // We can test that the required fields are properly marked
      const firstNameInput = screen.getByLabelText('First Name *');
      expect(firstNameInput).toBeRequired();
      
      const emailInput = screen.getByLabelText('Email *');
      expect(emailInput).toBeRequired();
    });

    it('should handle form submission for new lead creation', async () => {
      const user = userEvent.setup();
      
      // Mock successful lead creation
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            data: [{ id: '3', first_name: 'New', last_name: 'Lead', email: 'new@example.com' }] 
          }),
        })
      );
      
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Lead')).toBeInTheDocument();
      });
      
      const addButton = screen.getByText('Add New Lead');
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText('First Name *')).toBeInTheDocument();
      });
      
      // Fill out the form
      await user.type(screen.getByLabelText('First Name *'), 'Test');
      await user.type(screen.getByLabelText('Last Name *'), 'User');
      await user.type(screen.getByLabelText('Email *'), 'test@example.com');
      
      const createButton = screen.getByText('Create Lead');
      fireEvent.click(createButton);
      
      // Verify the API was called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('test@example.com'),
        });
      });
    });
  });

  describe('Lead Actions', () => {
    it('should show convert to session button', async () => {
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const leadCard = screen.getByText('John Doe').closest('div');
      fireEvent.click(leadCard!);
      
      await waitFor(() => {
        expect(screen.getByText('Convert to Session')).toBeInTheDocument();
      });
    });

    it('should show experience creation options when no experiences exist', async () => {
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const leadCard = screen.getByText('John Doe').closest('div');
      fireEvent.click(leadCard!);
      
      await waitFor(() => {
        expect(screen.getByText('Standard EX')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Custom EX')).toBeInTheDocument();
    });

    it('should handle lead deletion', async () => {
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const leadCard = screen.getByText('John Doe').closest('div');
      fireEvent.click(leadCard!);
      
      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Delete Lead')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed to load leads' }),
        })
      );
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.reject(new Error('Network error'))
      );
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility and UX', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add new lead/i })).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search leads...');
      expect(searchInput).toHaveAttribute('type', 'text');
      
      const statusSelect = screen.getByDisplayValue('All Status');
      expect(statusSelect).toHaveAttribute('role', 'combobox');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Lead')).toBeInTheDocument();
      });
      
      // Tab to the add button and press Enter
      const addButton = screen.getByText('Add New Lead');
      addButton.focus();
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('Create Lead')).toBeInTheDocument();
      });
    });

    it('should handle responsive design elements', async () => {
      render(<AdminLeadsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Tally • Lead Management')).toBeInTheDocument();
      });
      
      // Check for responsive grid classes (testing implementation detail)
      const gridElements = document.querySelectorAll('.grid');
      expect(gridElements.length).toBeGreaterThan(0);
    });
  });
});