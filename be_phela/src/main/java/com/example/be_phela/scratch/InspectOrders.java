
import java.sql.*;

public class InspectOrders {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/phela";
        String user = "postgres";
        String password = "postgres";

        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            System.out.println("Orders with status DELIVERED:");
            // In Postgres, table names are usually lowercase unless quoted. Entity name is "orders".
            String query = "SELECT order_code, payment_status, branch_code, final_amount FROM orders WHERE order_status = 'DELIVERED' LIMIT 10";
            try (Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(query)) {
                while (rs.next()) {
                    System.out.printf("Code: %s, PaymentStatus: %s, Branch: %s, Amount: %f%n",
                            rs.getString("order_code"),
                            rs.getString("payment_status"),
                            rs.getString("branch_code"),
                            rs.getDouble("final_amount"));
                }
            }
            
            System.out.println("\nAll distinct branch_codes in orders:");
            query = "SELECT DISTINCT branch_code FROM orders";
             try (Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(query)) {
                while (rs.next()) {
                    System.out.println("BranchCode: " + rs.getString("branch_code"));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
