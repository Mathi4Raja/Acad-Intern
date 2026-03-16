import 'package:flutter/material.dart';

class AppDropdownStyles {
  const AppDropdownStyles._();

  static const textStyle = TextStyle(
    fontWeight: FontWeight.w600,
    color: Color(0xFF374151),
  );

  static const menuStyle = MenuStyle(
    backgroundColor: WidgetStatePropertyAll(Colors.white),
    elevation: WidgetStatePropertyAll(4),
    padding: WidgetStatePropertyAll(EdgeInsets.zero),
    shape: WidgetStatePropertyAll(
      RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(14)),
      ),
    ),
    side: WidgetStatePropertyAll(
      BorderSide(color: Color(0xFFE2E8F0)),
    ),
  );

  static InputDecorationTheme inputDecorationTheme({
    required bool compact,
    double borderRadius = 12,
  }) {
    return InputDecorationTheme(
      isDense: true,
      contentPadding: EdgeInsets.symmetric(
        horizontal: 14,
        vertical: compact ? 8 : 10,
      ),
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(borderRadius),
        borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(borderRadius),
        borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(borderRadius),
        borderSide: const BorderSide(color: Color(0xFF2563EB), width: 1.4),
      ),
    );
  }

  static List<DropdownMenuEntry<String>> buildEntries(
    List<String> values, {
    required String? selected,
    String Function(String)? labelBuilder,
  }) {
    return values.map((value) {
      final isSelected = value == selected;
      return DropdownMenuEntry<String>(
        value: value,
        label: labelBuilder?.call(value) ?? value,
        trailingIcon: isSelected
            ? const Icon(
                Icons.circle,
                size: 8,
                color: Color(0xFF145DE0),
              )
            : null,
        style: ButtonStyle(
          backgroundColor: WidgetStatePropertyAll(
            isSelected ? const Color(0xFFF1F5FF) : Colors.white,
          ),
          foregroundColor: WidgetStatePropertyAll(
            isSelected ? const Color(0xFF145DE0) : const Color(0xFF334155),
          ),
          textStyle: const WidgetStatePropertyAll(
            TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
      );
    }).toList();
  }
}
