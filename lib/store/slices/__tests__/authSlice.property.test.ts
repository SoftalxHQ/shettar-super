/**
 * Property-Based Tests: Auth Slice
 * Feature: redux-toolkit-state-management
 *
 * Validates: Requirements 3.5
 */

import fc from "fast-check";
import { describe, it } from "vitest";
import authReducer, { login, logout, updateAdmin, type Admin } from "../authSlice";

// Arbitrary for generating valid Admin objects
const adminArbitrary = fc.record<Admin>({
  id: fc.integer({ min: 1 }),
  email: fc.emailAddress(),
  name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  first_name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  last_name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  other_name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  phone_number: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  address: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  zip_code: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
  gender: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
  date_of_birth: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  admin_unique_id: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  role: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  avatar_url: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
});

describe("Property Tests: Auth Slice", () => {
  /**
   * Property 2: Auth Slice Login State Update
   * Feature: redux-toolkit-state-management, Property 2
   *
   * Validates: Requirements 3.5
   */
  it("Property 2: Auth Slice Login State Update", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }), // token - non-empty string
        adminArbitrary,              // admin object
        (token, admin) => {
          const initialState = {
            admin: null,
            token: null,
            isAuthenticated: false,
          };

          const nextState = authReducer(initialState, login({ token, admin }));

          return (
            nextState.token === token &&
            nextState.admin === admin &&
            nextState.isAuthenticated === true
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 3: Auth Slice Logout State Reset
   * Feature: redux-toolkit-state-management, Property 3
   *
   * Validates: Requirements 3.7
   */
  it("Property 3: Auth Slice Logout State Reset", () => {
    fc.assert(
      fc.property(
        fc.option(fc.string({ minLength: 1 }), { nil: null }),
        fc.option(adminArbitrary, { nil: null }),
        fc.boolean(),
        (token, admin, isAuthenticated) => {
          const initialState = { admin, token, isAuthenticated };
          const nextState = authReducer(initialState, logout());

          return (
            nextState.token === null &&
            nextState.admin === null &&
            nextState.isAuthenticated === false
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 4: Auth Slice Update Admin Preservation
   * Feature: redux-toolkit-state-management, Property 4
   *
   * Validates: Requirements 3.9
   */
  it("Property 4: Auth Slice Update Admin Preservation", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }), // existing token
        adminArbitrary,              // existing admin
        adminArbitrary,              // new admin data
        (token, existingAdmin, newAdmin) => {
          const initialState = {
            admin: existingAdmin,
            token,
            isAuthenticated: true,
          };

          const nextState = authReducer(initialState, updateAdmin(newAdmin));

          return (
            nextState.admin?.id === newAdmin.id &&
            nextState.admin?.email === newAdmin.email &&
            nextState.token === token &&
            nextState.isAuthenticated === true
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
