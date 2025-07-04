@@ .. @@
 CREATE TYPE stripe_subscription_status AS ENUM (
     'not_started',
     'incomplete',
     'incomplete_expired',
     'trialing',
     'active',
     'past_due',
     'canceled',
     'unpaid',
-    'paused'
+    'paused'
 );
@@ .. @@