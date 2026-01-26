-- Create trigger on auth.users to handle new user registration
-- This trigger creates profile, assigns role, and creates pending approval

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();