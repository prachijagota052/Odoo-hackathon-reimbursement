import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';

interface Country {
  name: { common: string };
  cca2: string;
  currencies?: { [key: string]: { name: string; symbol: string } };
}

export const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

    useEffect(() => {
      const fetchCountries = async () => {
      try {
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,currencies"
        );
        const data = await res.json();

        // Transform data (IMPORTANT)
        const formatted = data.map((c: any): Country => ({
          name: c.name,
          cca2: c.cca2,
          currencies: c.currencies
        }));

        setCountries(formatted);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };

  fetchCountries();
}, []);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country.name.common);
    // Auto-set base currency from selected country
    if (country.currencies) {
      const currencyCode = Object.keys(country.currencies)[0];
      setBaseCurrency(currencyCode);
    }
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");

    if (!selectedCountry || !baseCurrency) {
      toast.error('Please select a country');
      return;
    }

    setLoading(true);
    try {
      await signup(name, email, password, selectedCountry, baseCurrency);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      toast.error('Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl mb-2">Create Account</h2>
          <p className="text-gray-600">Start managing your expenses</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
    

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
  
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {/* Live match message */}
            {confirmPassword && (
              <p className={`text-sm ${
                password === confirmPassword ? "text-green-500" : "text-red-500"
          }`}>
            {password === confirmPassword
              ? "Passwords match"
              : "Passwords do not match"}
          </p>
        )}

            {/* Error message */}
            {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {selectedCountry || "Select country..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search country..." />
                  <CommandList>
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup>
                      {countries.map((country) => (
                        <CommandItem
                          key={country.cca2}
                          value={country.name.common}
                          onSelect={() => handleCountrySelect(country)}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selectedCountry === country.name.common ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          {country.name.common}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {baseCurrency && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Company Base Currency:</span> {baseCurrency}
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>

        <div className="text-center text-sm">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
